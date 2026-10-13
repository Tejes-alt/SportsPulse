import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchNames, fetchPlayers } from '../lib/api';
import { fuzzySearch, editDistance, Trie, kmpSearch, naiveSearch, rabinKarpSearch, zSearch } from '../lib/algorithms';
import { fmtInt, fmtDec } from '../lib/format';
import { PageHeader, Seg, SearchBox, Card, Eyebrow, Empty, Complexity, Btn } from '../components/kit';
import { Search as SearchIcon, Zap, CornerDownLeft, Check, X, Minus, ArrowRight, Wand2, FlaskConical } from 'lucide-react';

const MODES = [
  { k: 'auto', label: 'Auto' }, { k: 'exact', label: 'Exact' }, { k: 'prefix', label: 'Prefix' }, { k: 'substring', label: 'Pattern' }, { k: 'fuzzy', label: 'Fuzzy' },
];
const SUBS = [{ k: 'kmp', label: 'KMP' }, { k: 'rabin', label: 'Rabin-Karp' }, { k: 'z', label: 'Z-Function' }, { k: 'naive', label: 'Naive' }];
const ALGO_META = {
  exact: { name: 'Trie exact lookup', time: 'O(|q|)', space: 'O(Σ|names|)' },
  prefix: { name: 'Trie prefix walk + DFS', time: 'O(|q| + k)', space: 'O(Σ|names|)' },
  kmp: { name: 'Knuth-Morris-Pratt', time: 'O(n + m) per name', space: 'O(m)' },
  rabin: { name: 'Rabin-Karp rolling hash', time: 'O(n + m) avg per name', space: 'O(1)' },
  z: { name: 'Z-Function', time: 'O(n + m) per name', space: 'O(n + m)' },
  naive: { name: 'Naive sliding window', time: 'O(n · m) per name', space: 'O(1)' },
  fuzzy: { name: 'Wagner-Fischer edit distance', time: 'O(|q| · |name|) per name', space: 'O(|q| · |name|)' },
};

function substringRun(algo, text, pat) {
  if (algo === 'kmp') { const r = kmpSearch(text, pat); return { hit: r.matches.length > 0, comps: r.comparisons, pos: r.matches[0] }; }
  if (algo === 'naive') { const r = naiveSearch(text, pat); return { hit: r.matches.length > 0, comps: r.comparisons, pos: r.matches[0] }; }
  if (algo === 'rabin') { const r = rabinKarpSearch(text, pat); return { hit: r.matches.length > 0, comps: r.comparisons, pos: r.matches[0] }; }
  const r = zSearch(text, pat); return { hit: r.matches.length > 0, comps: r.z.length, pos: r.matches[0] };
}

export default function SmartSearch() {
  const [params, setParams] = useSearchParams();
  const [format, setFormat] = useState('All');
  const [mode, setMode] = useState('auto');
  const [sub, setSub] = useState('kmp');
  const [q, setQ] = useState(params.get('q') || '');
  const [names, setNames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const wrap = useRef(null);

  useEffect(() => {
    const f = format === 'All' ? 'all' : format;
    fetchNames(f).then(setNames).catch(() => {});
    const reqs = format === 'All' ? [fetchPlayers({ format: 'ODI', limit: 500 }), fetchPlayers({ format: 'Test', limit: 500 })] : [fetchPlayers({ format, limit: 500 })];
    Promise.all(reqs).then(rs => setPlayers(rs.flatMap(r => r.items || []))).catch(() => {});
  }, [format]);

  const trie = useMemo(() => { const t = new Trie(); t.insertMany(names); return t; }, [names]);
  const suggestions = useMemo(() => (q.trim() && names.length ? trie.autocomplete(q.trim(), 6) : []), [q, trie, names]);
  useEffect(() => { const h = e => { if (!wrap.current?.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);

  const run = (query = q) => {
    const raw = query.trim(); if (!raw || !names.length) return;
    const ql = raw.toLowerCase();
    const t0 = performance.now();
    const stages = []; let matches = []; let algo = null; let scanned = 0;

    const exact = () => { const hits = trie.autocomplete(raw, 50).filter(n => n.toLowerCase() === ql); scanned += 1; return hits.map(n => ({ name: n, via: 'exact', distance: 0 })); };
    const prefix = () => { const hits = trie.autocomplete(raw, 25); scanned += hits.length; return hits.map(n => ({ name: n, via: 'prefix', distance: editDistance(ql, n.toLowerCase()) })); };
    const substring = () => { const out = []; for (const n of names) { scanned++; const r = substringRun(sub, n.toLowerCase(), ql); if (r.hit) out.push({ name: n, via: sub, comparisons: r.comps, pos: r.pos, distance: editDistance(ql, n.toLowerCase()) }); } return out.slice(0, 25); };
    const fuzzy = () => { scanned += names.length; return fuzzySearch(raw, names, 8).map(m => ({ ...m, via: 'fuzzy' })); };

    if (mode === 'auto') {
      const pipeline = [['exact', exact], ['prefix', prefix], [sub, substring], ['fuzzy', fuzzy]];
      for (const [k, fn] of pipeline) {
        if (matches.length) { stages.push({ k, status: 'skipped' }); continue; }
        const r = fn(); stages.push({ k, status: r.length ? 'hit' : 'miss', count: r.length });
        if (r.length) { matches = r; algo = k; }
      }
    } else {
      algo = mode === 'substring' ? sub : mode;
      matches = mode === 'exact' ? exact() : mode === 'prefix' ? prefix() : mode === 'substring' ? substring() : fuzzy();
      stages.push({ k: algo, status: matches.length ? 'hit' : 'miss', count: matches.length });
    }
    const ms = performance.now() - t0;
    const best = matches[0];
    const didYouMean = algo === 'fuzzy' && best && best.distance > 0 && best.name.toLowerCase() !== ql ? best.name : null;
    setResult({ query: raw, algo, matches, stages, ms, scanned, didYouMean, mode });
    setParams({ q: raw }, { replace: true });
    setOpen(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (params.get('q') && names.length) run(params.get('q')); }, [names]);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (open && suggestions[idx]) { setQ(suggestions[idx]); run(suggestions[idx]); } else run(); }
    else if (e.key === 'Escape') setOpen(false);
  };
  const recordsFor = (name) => players.filter(p => p.name === name);
  const meta = result ? ALGO_META[result.algo] : null;

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
      <PageHeader eyebrow="Signature feature" icon={Zap} title="Smart Search" desc="Type an exact name, a prefix, a fragment, or a misspelling. A hand-written algorithm pipeline — Trie → KMP → Wagner-Fischer — resolves it and tells you exactly which algorithm produced each result."
        right={<Link to="/lab" data-testid="ss-lab-link" className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md border border-[#23312A] bg-[#0F1614] hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-300 transition-colors"><FlaskConical className="h-4 w-4" /> Open Algorithm Lab</Link>} />

      <Card hover={false} className="p-4 sm:p-5 mb-5 relative z-20" testid="ss-panel">
        <div ref={wrap} className="relative">
          <SearchBox big icon={SearchIcon} testid="search-q" value={q} autoFocus onChange={v => { setQ(v); setOpen(true); setIdx(0); }} onKeyDown={onKey} placeholder="Try 'Viraat Kohli', 'Tendlkar', 'Kum' or 'Singh'">
            {q && <button data-testid="ss-clear" onClick={() => { setQ(''); setResult(null); setParams({}, { replace: true }); }} className="p-1.5 text-zinc-500 hover:text-zinc-200"><X className="h-4 w-4" /></button>}
            <Btn data-testid="ss-run" onClick={() => run()}>Run <CornerDownLeft className="h-3.5 w-3.5" /></Btn>
          </SearchBox>
          <AnimatePresence>
            {open && suggestions.length > 0 && (
              <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} data-testid="ss-autocomplete"
                className="absolute z-30 mt-2 w-full rounded-lg border border-[#23312A] bg-[#0B110E]/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,.8)] overflow-hidden">
                <li className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-zinc-500 border-b border-[#1A221E] flex justify-between"><span>Trie autocomplete</span><span className="font-mono">O(|prefix| + k)</span></li>
                {suggestions.map((s, i) => (
                  <li key={s}><button data-testid={`ss-sug-${i}`} onMouseEnter={() => setIdx(i)} onClick={() => { setQ(s); run(s); }} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${i === idx ? 'bg-emerald-500/10 text-emerald-200' : 'text-zinc-300'}`}>
                    <span><span className="text-emerald-400 font-semibold">{s.slice(0, q.trim().length)}</span>{s.slice(q.trim().length)}</span>
                    <span className="font-mono text-[10px] text-zinc-500">{recordsFor(s).map(p => p.format).join(' · ')}</span></button></li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mt-4">
          <Seg size="sm" testid="ss-mode" value={mode} onChange={setMode} options={MODES} />
          <AnimatePresence>{(mode === 'auto' || mode === 'substring') && <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}><Seg size="sm" testid="ss-sub" value={sub} onChange={setSub} options={SUBS} /></motion.div>}</AnimatePresence>
          <div className="lg:ml-auto"><Seg size="sm" testid="ss-fmt" value={format} onChange={setFormat} options={['All', 'ODI', 'Test']} /></div>
        </div>
        <div className="mt-3 text-[11px] text-zinc-500 font-mono">{names.length} unique names indexed in Trie · {players.length} player records loaded</div>
      </Card>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div key={result.query + result.algo} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {result.didYouMean && (
              <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-wrap items-center gap-3" data-testid="did-you-mean">
                <Wand2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-zinc-300">Did you mean <button data-testid="dym-btn" onClick={() => { setQ(result.didYouMean); run(result.didYouMean); }} className="font-bold text-emerald-300 hover:underline">{result.didYouMean}</button>?</span>
                <span className="text-xs font-mono text-zinc-500 ml-auto">"{result.query}" → "{result.didYouMean}" · edit distance {result.matches[0].distance}</span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card hover={false} className="p-5 lg:col-span-1" testid="ss-pipeline">
                <Eyebrow>{result.mode === 'auto' ? 'Resolution pipeline' : 'Algorithm executed'}</Eyebrow>
                <ul className="mt-3 space-y-2">
                  {result.stages.map((s, i) => (
                    <motion.li key={s.k} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} data-testid={`stage-${s.k}`}
                      className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${s.status === 'hit' ? 'border-emerald-500/40 bg-emerald-500/10' : s.status === 'miss' ? 'border-red-500/20 bg-red-500/5' : 'border-[#1A221E] bg-[#0B110E] opacity-60'}`}>
                      <span className="font-mono text-[10px] text-zinc-500 w-4">{i + 1}</span>
                      <span className="flex-1 truncate">{ALGO_META[s.k]?.name}</span>
                      {s.status === 'hit' ? <span className="flex items-center gap-1 text-emerald-300 font-mono text-xs"><Check className="h-3.5 w-3.5" />{s.count}</span> : s.status === 'miss' ? <span className="flex items-center gap-1 text-red-300 font-mono text-xs"><X className="h-3.5 w-3.5" />0</span> : <span className="flex items-center gap-1 text-zinc-500 font-mono text-xs"><Minus className="h-3.5 w-3.5" />skip</span>}
                    </motion.li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-[#1A221E] space-y-2 text-xs font-mono">
                  <div className="flex justify-between"><span className="text-zinc-500">Produced by</span><span className="text-emerald-300 font-bold text-right">{meta?.name}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Measured runtime</span><span className="text-zinc-200">{result.ms.toFixed(3)} ms</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Candidates scanned</span><span className="text-zinc-200">{fmtInt(result.scanned)}</span></div>
                  <div className="pt-1"><Complexity time={meta?.time} space={meta?.space} /></div>
                </div>
              </Card>

              <Card hover={false} className="lg:col-span-2 overflow-hidden" testid="ss-results">
                <div className="px-5 py-3.5 border-b border-[#23312A] flex items-center justify-between">
                  <div><Eyebrow>Results</Eyebrow><div className="font-bold">"{result.query}" · <span className="text-emerald-400">{result.matches.length}</span> match{result.matches.length === 1 ? '' : 'es'}</div></div>
                  <span className="text-[10px] font-mono px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 uppercase tracking-wider">{result.algo}</span>
                </div>
                {result.matches.length === 0 ? <Empty title="No matches" desc="Switch to Auto or Fuzzy mode to resolve typos with Wagner-Fischer edit distance." /> : (
                  <ul className="divide-y divide-[#1A221E]">
                    {result.matches.map((m, i) => {
                      const recs = recordsFor(m.name); const ql = result.query.toLowerCase(); const nl = m.name.toLowerCase();
                      const pos = m.pos ?? (nl.startsWith(ql) ? 0 : nl.indexOf(ql));
                      return (
                        <motion.li key={m.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, duration: 0.25 }} className="px-5 py-3 flex items-center gap-4 hover:bg-[#141B18] transition-colors" data-testid={`result-row-${i}`}>
                          <div className={`w-7 font-mono text-xs ${i === 0 ? 'text-emerald-400 font-bold' : 'text-zinc-500'}`}>{String(i + 1).padStart(2, '0')}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold">
                              {pos >= 0 && m.via !== 'fuzzy' ? <>{m.name.slice(0, pos)}<mark className="bg-emerald-500/25 text-emerald-200 rounded px-0.5">{m.name.slice(pos, pos + ql.length)}</mark>{m.name.slice(pos + ql.length)}</> : m.name}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {recs.length ? recs.map(p => (
                                <Link key={`${p.format}-${p.id}`} data-testid={`result-${p.format.toLowerCase()}-${p.id}`} to={`/players/${p.format}/${p.id}`} className="text-[11px] font-mono px-2 py-0.5 rounded border border-[#23312A] bg-[#0B110E] text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors">
                                  {p.format} · {p.mat} mat · {fmtInt(p.runs)} runs · avg {fmtDec(p.avg)} <ArrowRight className="h-3 w-3" /></Link>
                              )) : <span className="text-[11px] text-zinc-600">loading record…</span>}
                            </div>
                          </div>
                          <div className="text-right text-[11px] font-mono text-zinc-500 space-y-0.5 shrink-0">
                            <div className="text-emerald-300/90 uppercase tracking-wider">{ALGO_META[m.via]?.name.split(' ')[0]}</div>
                            <div>edit dist <span className="text-zinc-200 font-bold">{m.distance}</span></div>
                            {m.comparisons !== undefined && <div>{m.comparisons} comparisons</div>}
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3" data-testid="ss-examples">
          {[['Viraat Kohli', 'Misspelling → fuzzy'], ['Tendlkar', 'Missing letter → fuzzy'], ['Kum', 'Prefix → Trie'], ['Singh', 'Fragment → KMP']].map(([ex, why]) => (
            <button key={ex} data-testid={`ss-example-${ex.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => { setQ(ex); run(ex); }} className="group text-left rounded-lg border border-[#23312A] bg-[#121815] p-4 hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all">
              <div className="font-mono text-emerald-300 group-hover:text-emerald-200">"{ex}"</div><div className="text-xs text-zinc-500 mt-1">{why}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
