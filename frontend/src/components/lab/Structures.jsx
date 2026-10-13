import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trie, AhoCorasick, kmpSearch, naiveSearch, rabinKarpSearch, zSearch } from '../../lib/algorithms';
import { layoutTrie } from '../../lib/traces';
import { fetchNames } from '../../lib/api';
import { Btn } from '../kit';
import { Timer, Loader2 } from 'lucide-react';

export function TrieViz({ words, prefix }) {
  const trie = useMemo(() => { const t = new Trie(); words.forEach(w => t.insert(w)); return t; }, [words]);
  const suggestions = useMemo(() => trie.autocomplete(prefix, 20), [trie, prefix]);
  const lay = useMemo(() => layoutTrie(trie, prefix), [trie, prefix]);
  const X = 34, Y = 46, PAD = 20;
  const w = Math.max(320, (lay.width) * X + PAD * 2), h = (lay.depth + 1) * Y + PAD * 2;
  const pos = (n) => ({ x: PAD + n.x * X + X / 2, y: PAD + n.depth * Y + 10 });
  const pl = prefix.toLowerCase();
  const nodeDepthPath = useMemo(() => {
    // rebuild by walking with layout ids properly
    const ids = new Set([0]); let cur = lay.nodes[0]; let walked = '';
    for (const c of pl) {
      const child = lay.nodes.find(n => n.parent === cur.id && n.ch === c); if (!child) break;
      ids.add(child.id); cur = child; walked += c;
    }
    return { ids, complete: walked === pl };
  }, [lay, pl]);
  const inSubtree = (n) => { if (!nodeDepthPath.complete || !pl) return false; let cur = n; while (cur) { if (nodeDepthPath.ids.has(cur.id) && cur.depth === pl.length) return true; if (cur.depth <= pl.length) return false; cur = lay.nodes[cur.parent]; } return false; };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4" data-testid="viz-trie">
      <div className="rounded-lg border border-[#23312A] bg-[#0B110E] overflow-auto scrollbar-thin p-2 max-h-[520px]">
        <svg width={w} height={h} className="block mx-auto" data-testid="trie-svg">
          {lay.edges.map(([p, c]) => { const a = pos(lay.nodes[p]), b = pos(lay.nodes[c]); const hot = nodeDepthPath.ids.has(c) || inSubtree(lay.nodes[c]); return <motion.line key={`${p}-${c}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hot ? '#10B981' : '#23312A'} strokeWidth={hot ? 2 : 1} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />; })}
          {lay.nodes.map(n => {
            const p = pos(n); const onP = nodeDepthPath.ids.has(n.id); const sub = inSubtree(n);
            const fill = onP ? '#10B981' : sub ? (n.isEnd ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.12)') : n.isEnd ? '#1A2F26' : '#121815';
            const stroke = onP ? '#34D399' : sub ? '#10B981' : n.isEnd ? '#10B98188' : '#2E4036';
            return (
              <motion.g key={n.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: n.depth * 0.04, type: 'spring', stiffness: 300, damping: 20 }} style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
                <circle cx={p.x} cy={p.y} r={n.depth === 0 ? 9 : 11} fill={fill} stroke={stroke} strokeWidth={n.isEnd ? 2 : 1} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fontFamily="JetBrains Mono" fill={onP ? '#000' : sub ? '#D1FAE5' : '#9CA3AF'} fontWeight={onP || n.isEnd ? 700 : 400}>{n.depth === 0 ? '∅' : n.ch}</text>
                {n.isEnd && <circle cx={p.x + 9} cy={p.y - 9} r={3} fill="#A3E635" />}
              </motion.g>
            );
          })}
        </svg>
      </div>
      <div className="space-y-3">
        <div className="rounded-lg border border-[#23312A] bg-[#0F1513] p-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Prefix walk</div>
          <div className="font-mono text-lg mt-1">{pl ? [...pl].map((c, i) => <span key={i} className={i < nodeDepthPath.ids.size - 1 ? 'text-emerald-400' : 'text-red-400 line-through'}>{c}</span>) : <span className="text-zinc-600">∅ (root)</span>}</div>
          <div className="text-[11px] text-zinc-500 mt-1">{nodeDepthPath.complete ? `Walked ${pl.length} edge${pl.length === 1 ? '' : 's'} → DFS the subtree for words.` : 'Prefix leaves the trie — no suggestions.'}</div>
        </div>
        <div className="rounded-lg border border-[#23312A] bg-[#0F1513] p-4">
          <div className="flex items-center justify-between"><div className="text-[10px] uppercase tracking-widest text-zinc-500">Suggestions</div><span className="font-mono text-[10px] text-zinc-500">{suggestions.length} / {trie.size()} words</span></div>
          <div className="flex flex-wrap gap-1.5 mt-2" data-testid="trie-suggestions">
            {suggestions.length === 0 ? <span className="text-sm text-zinc-600">No words with this prefix</span> : suggestions.map((s, i) => <motion.span key={s} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="font-mono text-xs px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"><span className="text-emerald-400 font-bold">{s.slice(0, pl.length)}</span>{s.slice(pl.length)}</motion.span>)}
          </div>
        </div>
        <div className="text-[11px] text-zinc-500 leading-relaxed">Nodes: <span className="text-zinc-300">{lay.nodes.length}</span> · Terminal nodes (● lime dot) mark complete words. Lookup cost depends only on prefix length, not dictionary size.</div>
      </div>
    </div>
  );
}

export function AhoViz({ patterns, text }) {
  const ac = useMemo(() => new AhoCorasick(patterns), [patterns]);
  const hits = useMemo(() => ac.search(text), [ac, text]);
  const stats = useMemo(() => { let nodes = 0; const q = [ac.root]; while (q.length) { const n = q.shift(); nodes++; for (const c of n.children.values()) q.push(c); } return nodes; }, [ac]);
  const colorOf = (p) => ['#10B981', '#F59E0B', '#3B82F6', '#A3E635', '#EC4899', '#22D3EE'][patterns.indexOf(p) % 6];
  const cover = new Map();
  hits.forEach(h => { for (let k = h.index; k < h.index + h.pattern.length; k++) if (!cover.has(k)) cover.set(k, h.pattern); });
  return (
    <div data-testid="viz-aho">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 font-mono text-xs mb-4">
        {[['Patterns', patterns.length], ['Automaton nodes', stats], ['Text length', text.length], ['Hits (single pass)', hits.length]].map(([l, v]) => <div key={l} className="rounded-md border border-[#23312A] bg-[#0F1614] p-2.5"><div className="text-[10px] uppercase text-zinc-500 tracking-widest">{l}</div><div className="text-emerald-400 text-lg font-bold mt-0.5">{v}</div></div>)}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Text scan · every pattern found in one left-to-right pass</div>
      <div className="flex flex-wrap gap-[3px] font-mono text-sm" data-testid="aho-text">
        {[...text].map((c, k) => { const p = cover.get(k); return <motion.span key={k} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: k * 0.008 }} className="h-7 min-w-[1.4rem] px-1 flex items-center justify-center rounded border" style={p ? { borderColor: colorOf(p), background: `${colorOf(p)}33`, color: '#fff' } : { borderColor: 'transparent', color: '#71717A' }}>{c === ' ' ? '·' : c}</motion.span>; })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="rounded-lg border border-[#23312A] bg-[#0F1513] p-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Dictionary</div>
          <div className="flex flex-wrap gap-1.5">{patterns.map(p => { const n = hits.filter(h => h.pattern === p).length; return <span key={p} className="font-mono text-xs px-2 py-1 rounded border flex items-center gap-2" style={{ borderColor: `${colorOf(p)}88`, background: `${colorOf(p)}1a` }}><span className="h-2 w-2 rounded-sm" style={{ background: colorOf(p) }} />{p}<span className="text-zinc-400">×{n}</span></span>; })}</div>
        </div>
        <div className="rounded-lg border border-[#23312A] bg-[#0F1513] p-4 max-h-56 overflow-auto scrollbar-thin">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Hits</div>
          {hits.length === 0 ? <div className="text-sm text-zinc-600">No pattern occurs in the text.</div> : (
            <ul className="space-y-1 font-mono text-xs" data-testid="aho-hits">{hits.map((h, i) => <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex justify-between"><span style={{ color: colorOf(h.pattern) }}>{h.pattern}</span><span className="text-zinc-500">index {h.index}</span></motion.li>)}</ul>
          )}
        </div>
      </div>
      <div className="text-[11px] text-zinc-500 mt-3">Failure links let the automaton continue from the longest proper suffix that is also a dictionary prefix — so the text pointer never backtracks. Output links accumulate every pattern ending at a node.</div>
    </div>
  );
}

const ALGOS = [
  { k: 'naive', name: 'Naive', time: 'O(n·m)', space: 'O(1)', pre: '—', fn: naiveSearch, note: 'Worst case when many partial matches (e.g. "aaa…ab")' },
  { k: 'kmp', name: 'KMP', time: 'O(n+m)', space: 'O(m)', pre: 'O(m) LPS', fn: kmpSearch, note: 'Text pointer never backtracks' },
  { k: 'z', name: 'Z-Function', time: 'O(n+m)', space: 'O(n+m)', pre: '—', fn: zSearch, note: 'Concatenates pattern + sep + text' },
  { k: 'rabin', name: 'Rabin-Karp', time: 'O(n+m) avg · O(n·m) worst', space: 'O(1)', pre: 'O(m) hash', fn: rabinKarpSearch, note: 'Spurious hits verified char-by-char' },
  { k: 'trie', name: 'Trie prefix', time: 'O(|p| + k)', space: 'O(Σ|w|)', pre: 'O(Σ|w|) build', note: 'k = results returned' },
  { k: 'aho', name: 'Aho-Corasick', time: 'O(n + m + z)', space: 'O(m·σ)', pre: 'O(m) build', note: 'z = total occurrences, all patterns at once' },
  { k: 'edit', name: 'Wagner-Fischer', time: 'O(n·m)', space: 'O(n·m)', pre: '—', note: 'Rows can be reduced to O(min(n,m))' },
];

export function Benchmark() {
  const [names, setNames] = useState([]);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pattern, setPattern] = useState('singh');
  useEffect(() => { fetchNames('all').then(setNames).catch(() => {}); }, []);
  const runBench = () => {
    setBusy(true);
    setTimeout(() => {
      const corpus = names.map(n => n.toLowerCase()); const pat = pattern.toLowerCase(); const ROUNDS = 20;
      const out = ALGOS.filter(a => a.fn).map(a => {
        let matches = 0; let comps = 0;
        const t0 = performance.now();
        for (let r = 0; r < ROUNDS; r++) { matches = 0; comps = 0; for (const t of corpus) { const rr = a.fn(t, pat); matches += rr.matches.length; comps += rr.comparisons ?? rr.z?.length ?? 0; } }
        const ms = (performance.now() - t0) / ROUNDS;
        return { ...a, ms, matches, comps };
      });
      setRes({ rows: out, corpus: corpus.length, rounds: ROUNDS, chars: corpus.reduce((s, t) => s + t.length, 0), at: new Date().toLocaleTimeString() });
      setBusy(false);
    }, 30);
  };
  const maxMs = res ? Math.max(...res.rows.map(r => r.ms)) : 1;
  return (
    <div data-testid="benchmark">
      <div className="rounded-lg border border-[#23312A] bg-[#0F1513] overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-[#0B110E] text-[10px] uppercase tracking-widest text-zinc-500"><tr><th className="p-3 text-left">Algorithm</th><th className="p-3 text-left">Time</th><th className="p-3 text-left">Space</th><th className="p-3 text-left">Preprocessing</th><th className="p-3 text-left hidden lg:table-cell">Note</th></tr></thead>
          <tbody className="font-mono text-xs">{ALGOS.map(a => <tr key={a.k} className="border-t border-[#1A221E] hover:bg-[#141B18]"><td className="p-3 font-semibold text-zinc-100 font-sans">{a.name}</td><td className="p-3 text-emerald-400">{a.time}</td><td className="p-3 text-zinc-300">{a.space}</td><td className="p-3 text-zinc-400">{a.pre}</td><td className="p-3 text-zinc-500 hidden lg:table-cell font-sans">{a.note}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="rounded-lg border border-[#23312A] bg-[#121815] p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
          <div className="flex-1"><div className="text-[10px] uppercase tracking-widest text-zinc-500">Measured runtime · live in your browser</div><div className="text-sm text-zinc-400 mt-1">Runs each substring algorithm over all <span className="text-zinc-200 font-mono">{names.length}</span> unique player names, 20 rounds, and reports the mean wall-clock time via <span className="font-mono">performance.now()</span>. Numbers are real measurements from this device — they vary run to run.</div></div>
          <input data-testid="bench-pattern" value={pattern} onChange={e => setPattern(e.target.value)} className="bg-[#0F1614] border border-[#23312A] rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-emerald-500/50 w-40" placeholder="pattern" />
          <Btn data-testid="bench-run" onClick={runBench} disabled={busy || !names.length || !pattern}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Timer className="h-4 w-4" />} Run benchmark</Btn>
        </div>
        {res ? (
          <div className="space-y-2" data-testid="bench-results">
            {res.rows.map((r, i) => (
              <div key={r.k} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-xs font-mono">
                <span className="text-zinc-200 font-sans font-semibold">{r.name}</span>
                <div className="h-5 rounded bg-[#0B110E] border border-[#23312A] overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(r.ms / maxMs) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.08 }} className="h-full bg-emerald-500/70" /></div>
                <span className="text-right w-52 text-zinc-400"><span className="text-emerald-300 font-bold">{r.ms.toFixed(3)} ms</span> · {r.matches} hits · {r.comps.toLocaleString()} ops</span>
              </div>
            ))}
            <div className="text-[10px] text-zinc-600 pt-2">Measured {res.at} · corpus {res.corpus} names / {res.chars.toLocaleString()} chars · pattern "{pattern}" · mean of {res.rounds} rounds. Rabin-Karp's modular arithmetic is comparatively heavy in JS on short strings, which is why it rarely beats KMP here despite equal asymptotics.</div>
          </div>
        ) : <div className="text-xs text-zinc-600 font-mono">No benchmark run yet — nothing is shown until real measurements exist.</div>}
      </div>
    </div>
  );
}
