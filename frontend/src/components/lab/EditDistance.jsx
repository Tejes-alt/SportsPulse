import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { traceEditDistance } from '../../lib/traces';
import { usePlayback, Controls, Note } from './Playback';

const OP_COLOR = { match: 'text-emerald-300', substitute: 'text-amber-300', delete: 'text-red-300', insert: 'text-sky-300', base: 'text-zinc-400', keep: 'text-emerald-300' };

export default function EditDistance({ a, b }) {
  const run = useMemo(() => traceEditDistance(a, b), [a, b]);
  const pb = usePlayback(run.frames.length, { baseMs: 90 });
  const [hover, setHover] = useState(null);
  const f = run.frames[pb.frame];
  const filled = useMemo(() => { const s = new Set(); for (let k = 0; k <= pb.frame; k++) { const fr = run.frames[k]; if (fr) s.add(`${fr.i},${fr.j}`); } return s; }, [pb.frame, run.frames]);
  const onPath = useMemo(() => new Set(run.path.map(([i, j]) => `${i},${j}`)), [run.path]);
  const showPath = pb.done;
  const from = f?.from ? `${f.from[0]},${f.from[1]}` : null;
  const cellSize = Math.max(26, Math.min(40, Math.floor(640 / (b.length + 2))));

  return (
    <div data-testid="viz-edit">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <div className="flex items-end gap-3">
          <div><div className="text-[10px] uppercase tracking-widest text-zinc-500">Edit distance</div>
            <motion.div key={run.distance} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`text-5xl font-black font-mono leading-none ${showPath ? 'text-emerald-400 text-glow' : 'text-zinc-500'}`} data-testid="edit-distance-value">{showPath ? run.distance : '…'}</motion.div></div>
          <div className="text-xs text-zinc-500 pb-1 font-mono">"{a}" → "{b}"<br />{a.length}×{b.length} matrix · {run.frames.length} cells</div>
        </div>
        <div className="flex-1"><Controls pb={pb} total={run.frames.length} testid="pb-edit" /></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-5">
        <div className="overflow-auto scrollbar-thin rounded-lg border border-[#23312A] bg-[#0B110E] p-3 inline-block max-w-full">
          <table className="border-separate" style={{ borderSpacing: 3 }} data-testid="dp-matrix">
            <thead><tr><th style={{ width: cellSize, height: cellSize }} /><th className="text-zinc-500 font-mono text-xs" style={{ width: cellSize }}>ε</th>{[...b].map((c, j) => <th key={j} className={`font-mono text-sm ${f && f.j === j + 1 ? 'text-emerald-300' : 'text-emerald-500/80'}`} style={{ width: cellSize }}>{c === ' ' ? '·' : c}</th>)}</tr></thead>
            <tbody>
              {run.dp.map((row, i) => (
                <tr key={i}>
                  <td className={`font-mono text-sm text-center font-bold ${f && f.i === i ? 'text-emerald-300' : 'text-emerald-500/80'}`} style={{ height: cellSize }}>{i === 0 ? <span className="text-zinc-500 font-normal text-xs">ε</span> : a[i - 1] === ' ' ? '·' : a[i - 1]}</td>
                  {row.map((v, j) => {
                    const key = `${i},${j}`; const isFilled = filled.has(key); const cur = f && f.i === i && f.j === j;
                    const path = showPath && onPath.has(key); const isFrom = from === key; const final = i === a.length && j === b.length;
                    const cls = cur ? 'bg-emerald-400 text-black border-emerald-300 shadow-[0_0_16px_rgba(16,185,129,.7)] scale-110 z-10 cell-pop'
                      : path ? (final ? 'bg-emerald-500 text-black border-emerald-300 font-black' : 'bg-emerald-500/40 text-emerald-50 border-emerald-400/70')
                      : isFrom ? 'bg-amber-500/30 text-amber-100 border-amber-400'
                      : !isFilled ? 'bg-transparent text-transparent border-[#1A221E]'
                      : hover && (hover.i === i || hover.j === j) ? 'bg-[#17201C] text-zinc-200 border-[#2E4036]'
                      : i === 0 || j === 0 ? 'bg-[#0F1614] text-zinc-500 border-[#23312A]' : 'bg-[#121815] text-zinc-300 border-[#23312A]';
                    return <td key={j} data-testid={`dp-${i}-${j}`} onMouseEnter={() => setHover({ i, j })} onMouseLeave={() => setHover(null)} className={`relative rounded border font-mono text-xs text-center transition-all duration-150 cursor-default ${cls}`} style={{ width: cellSize, height: cellSize }}>{isFilled ? v : ''}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 min-w-0">
          <Note testid="note-edit">{f ? <span className={OP_COLOR[f.op]}>{f.note}</span> : '—'}</Note>
          <div className="rounded-lg border border-[#23312A] bg-[#0F1513] p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Recurrence</div>
            <pre className="font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{`dp[i][0] = i          dp[0][j] = j
dp[i][j] = dp[i-1][j-1]                     if a[i] = b[j]
         = 1 + min( dp[i-1][j]   ← delete
                    dp[i][j-1]   ← insert
                    dp[i-1][j-1] ← substitute )`}</pre>
          </div>
          <div className="rounded-lg border border-[#23312A] bg-[#0F1513] p-4">
            <div className="flex items-center justify-between mb-2"><div className="text-[10px] uppercase tracking-widest text-zinc-500">Optimal edit script · backtracked from dp[{a.length}][{b.length}]</div><span className="text-[10px] font-mono text-zinc-500">{showPath ? `${run.ops.filter(o => o.op !== 'keep').length} edits` : 'available at end of playback'}</span></div>
            <div className="flex flex-wrap gap-1.5" data-testid="edit-ops">
              {showPath ? run.ops.map((o, k) => (
                <motion.span key={k} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.04 }} className={`font-mono text-xs px-2 py-1 rounded border ${o.op === 'keep' ? 'border-[#23312A] bg-[#0B110E] text-zinc-500' : o.op === 'substitute' ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : o.op === 'delete' ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-sky-500/40 bg-sky-500/10 text-sky-300'}`}>
                  {o.op === 'keep' ? o.ch : o.op === 'substitute' ? `${o.from}→${o.to}` : o.op === 'delete' ? `−${o.ch}` : `+${o.ch}`}
                </motion.span>
              )) : <span className="text-xs text-zinc-600">Press ⏭ to jump to the result.</span>}
            </div>
            <div className="flex gap-3 mt-3 text-[10px] font-mono text-zinc-500"><span className="text-emerald-300">■ match/keep</span><span className="text-amber-300">■ substitute</span><span className="text-red-300">■ delete</span><span className="text-sky-300">■ insert</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
