import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { traceNaive, traceKMP, traceZ, traceRabinKarp } from '../../lib/traces';
import { usePlayback, Controls, Note } from './Playback';

const Cell = ({ ch, state, small, label }) => {
  const cls = {
    idle: 'border-[#23312A] text-zinc-400 bg-[#0F1614]',
    window: 'border-emerald-500/30 text-zinc-200 bg-emerald-500/[0.06]',
    cmp: 'border-emerald-400 text-emerald-100 bg-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,.5)] scale-110',
    bad: 'border-red-400 text-red-100 bg-red-500/40 shadow-[0_0_14px_rgba(239,68,68,.5)] scale-110',
    match: 'border-emerald-500/60 text-emerald-200 bg-emerald-500/25',
    ghost: 'border-transparent text-transparent',
  }[state || 'idle'];
  return (
    <div className="flex flex-col items-center">
      <div className={`${small ? 'h-6 w-6 text-[11px]' : 'h-8 w-8 text-sm'} flex items-center justify-center rounded border font-mono transition-all duration-150 ${cls}`}>{ch === ' ' ? '·' : ch}</div>
      {label !== undefined && <div className="text-[9px] font-mono text-zinc-600 mt-0.5">{label}</div>}
    </div>
  );
};

export default function StringMatch({ algo, text, pattern }) {
  const run = useMemo(() => {
    if (algo === 'kmp') return traceKMP(text, pattern);
    if (algo === 'naive') return traceNaive(text, pattern);
    if (algo === 'z') return traceZ(text, pattern);
    return traceRabinKarp(text, pattern);
  }, [algo, text, pattern]);
  const frames = run.frames; const pb = usePlayback(frames.length, { baseMs: algo === 'rabin' ? 320 : 200 });
  const f = frames[pb.frame] || {}; const m = pattern.length;
  const matches = f.matches || [];
  // window start
  const start = algo === 'kmp' ? f.i - f.j : algo === 'z' ? Math.max(0, f.i - m - 1) : f.i;
  const done = pb.done;

  const textState = (k) => {
    if (done && run.matches.some(s => k >= s && k < s + m)) return 'match';
    if (matches.some(s => k >= s && k < s + m)) return 'match';
    if (algo === 'z') return k === f.i - m - 1 ? 'cmp' : 'idle';
    if (algo === 'rabin') return k >= start && k < start + m ? (f.verified ? 'cmp' : f.spurious ? 'bad' : 'window') : 'idle';
    const cmpIdx = algo === 'kmp' ? f.i : f.i + f.j;
    if (k === cmpIdx) return f.eq ? 'cmp' : 'bad';
    if (k >= start && k < start + m) return 'window';
    return 'idle';
  };

  return (
    <div data-testid={`viz-${algo}`}>
      <Controls pb={pb} total={frames.length} testid={`pb-${algo}`} />
      <div className="mt-4 overflow-x-auto scrollbar-thin pb-2">
        <div className="inline-block min-w-full">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Text · n = {text.length}</div>
          <div className="flex gap-1">{[...text].map((c, k) => <Cell key={k} ch={c} state={textState(k)} label={k} />)}</div>
          {algo !== 'z' && (
            <>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-3 mb-1.5">Pattern · m = {m} · window at i = {Number.isFinite(start) ? start : '—'}</div>
              <motion.div className="flex gap-1" animate={{ x: (Number.isFinite(start) ? start : 0) * 36 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                {[...pattern].map((c, k) => {
                  let st = 'window';
                  if (algo === 'kmp' && k === f.j) st = f.eq ? 'cmp' : 'bad';
                  if (algo === 'naive' && k === f.j) st = f.eq ? 'cmp' : 'bad';
                  if (algo === 'kmp' && k < f.j) st = 'match';
                  if (algo === 'naive' && k < f.j) st = 'match';
                  if (algo === 'rabin') st = f.verified ? 'match' : f.spurious ? 'bad' : 'window';
                  return <Cell key={k} ch={c} state={st} label={k} />;
                })}
              </motion.div>
            </>
          )}
        </div>
      </div>
      <Note testid={`note-${algo}`}>{frames.length ? (f.note || '') : 'Enter a non-empty pattern no longer than the text.'}</Note>

      {algo === 'kmp' && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">LPS array (longest proper prefix that is also a suffix) · j = {f.j}</div>
          <div className="flex gap-1 flex-wrap" data-testid="lps-array">
            {run.lps.map((v, k) => (
              <div key={k} className={`flex flex-col items-center rounded border px-2 py-1 font-mono transition-all ${k === f.j ? 'border-emerald-400 bg-emerald-500/20' : k === f.j - 1 && !f.eq ? 'border-amber-400 bg-amber-500/20' : 'border-[#23312A] bg-[#0F1614]'}`}>
                <span className="text-[10px] text-zinc-500">{pattern[k]}</span><span className="text-emerald-400 text-sm font-bold">{v}</span><span className="text-[9px] text-zinc-600">{k}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2">On mismatch at j&gt;0 the pattern pointer falls back to <span className="font-mono text-amber-300">lps[j−1]</span> while the text pointer never moves backwards — that is what guarantees O(n+m).</div>
        </div>
      )}

      {algo === 'rabin' && (
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 font-mono text-xs" data-testid="rk-hashes">
          {[['Pattern hash', run.patternHash, 'text-emerald-400'], ['Window hash', f.textHash, f.hashEq ? 'text-emerald-400' : 'text-zinc-200'], ['Hash equal?', f.hashEq ? 'yes → verify' : 'no → roll', f.hashEq ? 'text-emerald-400' : 'text-zinc-400'], ['Verified matches', matches.length, 'text-emerald-400']].map(([l, v, c]) => (
            <div key={l} className="rounded-md border border-[#23312A] bg-[#0F1614] p-2.5"><div className="text-[10px] uppercase text-zinc-500 tracking-widest">{l}</div><div className={`mt-1 truncate ${c}`}>{v ?? '—'}</div></div>
          ))}
          <div className="col-span-2 lg:col-span-4 text-[11px] text-zinc-500">h(s) = Σ s[k]·256^(m−1−k) mod 1e9+7 · rolling update: h' = (256·(h − s[i]·256^(m−1)) + s[i+m]) mod p</div>
        </div>
      )}

      {algo === 'z' && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Z-array over S = pattern + '\0' + text · [l, r) = [{f.l ?? 0}, {f.r ?? 0})</div>
          <div className="flex gap-1 flex-wrap" data-testid="z-array">
            {(f.z || run.z).map((v, k) => {
              const S = pattern + '\u0000' + text; const isSep = k === m;
              const isMatch = k > m && v === m && k <= f.i;
              return <div key={k} className={`flex flex-col items-center rounded border px-1.5 py-0.5 font-mono text-[11px] transition-all ${k === f.i ? 'border-emerald-400 bg-emerald-500/25 scale-110' : isMatch ? 'border-emerald-500/60 bg-emerald-500/15' : k > f.i ? 'border-[#1A221E] text-zinc-700 bg-transparent' : k >= f.l && k < f.r ? 'border-emerald-500/25 bg-emerald-500/[0.06]' : 'border-[#23312A] bg-[#0F1614]'}`}>
                <span className="text-[9px] text-zinc-500">{isSep ? '\\0' : S[k] === ' ' ? '·' : S[k]}</span><span className={k > f.i ? 'text-zinc-700' : 'text-emerald-400'}>{k > f.i ? '?' : v}</span></div>;
            })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2">z[k] = length of the longest substring starting at k that is also a prefix of S. Any z[k] = m (after the separator) is a match at text index k − m − 1.</div>
        </div>
      )}
    </div>
  );
}
