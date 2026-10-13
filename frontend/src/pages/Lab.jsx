import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { naiveSearch, kmpSearch, zSearch, rabinKarpSearch, wagnerFischer } from '../lib/algorithms';
import { PageHeader, Card, Eyebrow, Complexity } from '../components/kit';
import StringMatch from '../components/lab/StringMatch';
import EditDistance from '../components/lab/EditDistance';
import { TrieViz, AhoViz, Benchmark } from '../components/lab/Structures';
import { FlaskConical, Code2, ArrowDownToLine, ArrowUpFromLine, Cpu } from 'lucide-react';

const TABS = [
  { k: 'kmp', label: 'KMP', title: 'Knuth-Morris-Pratt', time: 'O(n + m)', space: 'O(m)', desc: 'Preprocesses the pattern into an LPS table so that on a mismatch the pattern pointer jumps instead of the text pointer backtracking.' },
  { k: 'naive', label: 'Naive', title: 'Naive String Matching', time: 'O(n · m)', space: 'O(1)', desc: 'Brute force: align the pattern at every text position and compare character by character until a mismatch.' },
  { k: 'z', label: 'Z-Function', title: 'Z-Function', time: 'O(n + m)', space: 'O(n + m)', desc: 'Computes z[i] = longest common prefix of S and S[i..] over S = pattern + \\0 + text. Positions with z[i] = |pattern| are matches.' },
  { k: 'rabin', label: 'Rabin-Karp', title: 'Rabin-Karp Rolling Hash', time: 'O(n + m) avg', space: 'O(1)', desc: 'Hashes the pattern once, then rolls a polynomial hash across the text in O(1) per shift — only equal hashes are verified.' },
  { k: 'trie', label: 'Trie', title: 'Trie Autocomplete', time: 'O(|p| + k)', space: 'O(Σ|w|)', desc: 'A prefix tree. Walk down |p| edges, then depth-first collect the k words in that subtree.' },
  { k: 'aho', label: 'Aho-Corasick', title: 'Aho-Corasick Multi-Pattern', time: 'O(n + m + z)', space: 'O(m · σ)', desc: 'A trie of all patterns augmented with failure links — finds every occurrence of every pattern in a single pass over the text.' },
  { k: 'edit', label: 'Edit Distance', title: 'Wagner-Fischer Edit Distance', time: 'O(n · m)', space: 'O(n · m)', desc: 'Dynamic programming over prefixes: dp[i][j] is the minimum insertions, deletions and substitutions turning A[..i] into B[..j].' },
  { k: 'bench', label: 'Performance', title: 'Complexity & Measured Runtime', time: '—', space: '—', desc: 'Theoretical bounds side by side, plus a real benchmark executed on the player-name corpus in your browser.' },
];

const Input = ({ label, value, onChange, testid, rows }) => (
  <label className="block"><div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-1.5">{label}</div>
    {rows ? <textarea data-testid={testid} value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full bg-[#0F1614] border border-[#23312A] rounded-md p-3 text-sm font-mono outline-none focus:border-emerald-500/60 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] transition-all resize-y" />
      : <input data-testid={testid} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-[#0F1614] border border-[#23312A] rounded-md p-3 text-sm font-mono outline-none focus:border-emerald-500/60 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] transition-all" />}
  </label>
);

export default function Lab() {
  const [tab, setTab] = useState('kmp');
  const [text, setText] = useState('sachin ramesh tendulkar and sachin');
  const [pattern, setPattern] = useState('sachin');
  const [words, setWords] = useState('sachin\nsehwag\nsingh\nsaha\ntendulkar\ndravid\ndhoni\nkohli\nkumble\nkapil');
  const [prefix, setPrefix] = useState('sa');
  const [a, setA] = useState('viraat kohli');
  const [b, setB] = useState('virat kohli');
  const T = TABS.find(t => t.k === tab);
  const wordList = useMemo(() => words.split('\n').map(w => w.trim()).filter(Boolean), [words]);

  const output = useMemo(() => {
    if (tab === 'kmp') { const r = kmpSearch(text, pattern); return { main: `matches at [${r.matches.join(', ')}]`, sub: `${r.matches.length} match · ${r.comparisons} comparisons · LPS = [${r.lps.join(',')}]` }; }
    if (tab === 'naive') { const r = naiveSearch(text, pattern); return { main: `matches at [${r.matches.join(', ')}]`, sub: `${r.matches.length} match · ${r.comparisons} comparisons` }; }
    if (tab === 'z') { const r = zSearch(text, pattern); return { main: `matches at [${r.matches.join(', ')}]`, sub: `${r.matches.length} match · z-array of ${r.z.length} values` }; }
    if (tab === 'rabin') { const r = rabinKarpSearch(text, pattern); return { main: `matches at [${r.matches.join(', ')}]`, sub: `${r.matches.length} match · ${r.hashComparisons.length} windows · ${r.comparisons} comparisons` }; }
    if (tab === 'edit') { const r = wagnerFischer(a, b); return { main: `distance = ${r.distance}`, sub: `${(a.length + 1) * (b.length + 1)} DP cells` }; }
    if (tab === 'trie') return { main: `prefix "${prefix}"`, sub: `${wordList.length} words inserted` };
    if (tab === 'aho') return { main: `${wordList.length} patterns vs text`, sub: `${text.length} chars scanned once` };
    return null;
  }, [tab, text, pattern, a, b, prefix, wordList]);

  const inputSummary = tab === 'edit' ? `A = "${a}" · B = "${b}"` : tab === 'trie' ? `${wordList.length} words · prefix "${prefix}"` : tab === 'aho' ? `${wordList.length} patterns · text[${text.length}]` : `text[${text.length}] · pattern "${pattern}"`;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
      <PageHeader eyebrow="Interactive DSA" icon={FlaskConical} title="Algorithm Lab" desc="Every visualization below is driven by the same hand-written implementations that power Smart Search — recorded step by step, then played back. Change the inputs and watch the algorithms re-execute." />

      <div className="relative flex flex-wrap gap-1 mb-6 border-b border-[#23312A] pb-3" data-testid="lab-tabs">
        {TABS.map(t => (
          <button key={t.k} data-testid={`lab-tab-${t.k}`} onClick={() => setTab(t.k)} className={`relative px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.k ? 'text-black' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#141B18]'}`}>
            {tab === t.k && <motion.span layoutId="lab-tab" className="absolute inset-0 rounded-md bg-emerald-500 shadow-[0_0_20px_-4px_rgba(16,185,129,.7)]" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            <span className="relative z-10 flex items-center gap-1.5">{t.k === 'bench' && <Cpu className="h-3.5 w-3.5" />}{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
          {/* Info header */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-5">
            <Card hover={false} className="p-5" testid="algo-info">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><Eyebrow>Algorithm</Eyebrow><h2 className="text-2xl font-bold tracking-tight mt-1">{T.title}</h2><p className="text-sm text-zinc-500 mt-2 max-w-3xl leading-relaxed">{T.desc}</p></div>
                {tab !== 'bench' && <Complexity time={T.time} space={T.space} />}
              </div>
            </Card>
            {output && (
              <Card hover={false} className="p-5 lg:w-[340px] font-mono text-xs space-y-3" testid="algo-io">
                <div><div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500"><ArrowDownToLine className="h-3 w-3" />Input</div><div className="text-zinc-300 mt-1 truncate">{inputSummary}</div></div>
                <div><div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500"><ArrowUpFromLine className="h-3 w-3" />Output</div><div className="text-emerald-300 font-bold mt-1 truncate" data-testid="algo-output">{output.main}</div><div className="text-zinc-500 mt-0.5 truncate">{output.sub}</div></div>
              </Card>
            )}
          </div>

          {/* Inputs */}
          {['kmp', 'naive', 'z', 'rabin'].includes(tab) && (
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-5">
              <Input label="Text (n)" testid="lab-text" value={text} onChange={setText} />
              <Input label="Pattern (m)" testid="lab-pattern" value={pattern} onChange={setPattern} />
            </div>
          )}
          {tab === 'trie' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 mb-5">
              <Input label="Dictionary (one word per line)" testid="lab-words" value={words} onChange={setWords} rows={4} />
              <Input label="Prefix to autocomplete" testid="lab-prefix" value={prefix} onChange={setPrefix} />
            </div>
          )}
          {tab === 'aho' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
              <Input label="Patterns (one per line)" testid="lab-aho-words" value={words} onChange={setWords} rows={4} />
              <Input label="Text to scan" testid="lab-aho-text" value={text} onChange={setText} rows={4} />
            </div>
          )}
          {tab === 'edit' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
              <Input label="String A (rows)" testid="lab-a" value={a} onChange={setA} />
              <Input label="String B (columns)" testid="lab-b" value={b} onChange={setB} />
            </div>
          )}

          {/* Visualizer */}
          <Card hover={false} className="p-5 sm:p-6" testid={`lab-panel-${tab}`}>
            <div className="flex items-center gap-2 mb-4 text-[10px] uppercase tracking-widest text-zinc-500"><Code2 className="h-3 w-3 text-emerald-400" />Live execution · {T.label}</div>
            {['kmp', 'naive', 'z', 'rabin'].includes(tab) && (pattern.length && pattern.length <= text.length ? <StringMatch key={tab} algo={tab} text={text} pattern={pattern} /> : <div className="text-sm text-zinc-500" data-testid="lab-invalid">Enter a non-empty pattern that is not longer than the text.</div>)}
            {tab === 'trie' && <TrieViz words={wordList} prefix={prefix} />}
            {tab === 'aho' && <AhoViz patterns={wordList} text={text} />}
            {tab === 'edit' && <EditDistance a={a} b={b} />}
            {tab === 'bench' && <Benchmark />}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
