import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronsRight } from 'lucide-react';
import { Slider } from '../ui/slider';
import { Tip } from '../kit';

export function usePlayback(total, { autoplay = true, baseMs = 220 } = {}) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);
  useEffect(() => { setFrame(0); setPlaying(autoplay); }, [total, autoplay]);
  useEffect(() => {
    if (!playing || total === 0) return undefined;
    timer.current = setInterval(() => setFrame(f => { if (f >= total - 1) { setPlaying(false); return f; } return f + 1; }), Math.max(30, baseMs / speed));
    return () => clearInterval(timer.current);
  }, [playing, speed, total, baseMs]);
  const step = useCallback((d) => { setPlaying(false); setFrame(f => Math.min(total - 1, Math.max(0, f + d))); }, [total]);
  const reset = useCallback(() => { setFrame(0); setPlaying(true); }, []);
  const end = useCallback(() => { setPlaying(false); setFrame(Math.max(0, total - 1)); }, [total]);
  return { frame, setFrame, playing, setPlaying, speed, setSpeed, step, reset, end, done: total > 0 && frame >= total - 1 };
}

export function Controls({ pb, total, testid = 'pb' }) {
  const B = ({ onClick, label, children, tid, primary }) => (
    <Tip label={label}><button data-testid={`${testid}-${tid}`} onClick={onClick} className={`h-8 w-8 rounded-md flex items-center justify-center transition-all active:scale-90 ${primary ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_16px_-4px_rgba(16,185,129,.7)]' : 'border border-[#23312A] bg-[#0B110E] text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-300'}`}>{children}</button></Tip>
  );
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#23312A] bg-[#0F1513] px-3 py-2" data-testid={`${testid}-controls`}>
      <B tid="reset" label="Restart" onClick={pb.reset}><RotateCcw className="h-3.5 w-3.5" /></B>
      <B tid="prev" label="Step back" onClick={() => pb.step(-1)}><SkipBack className="h-3.5 w-3.5" /></B>
      <B tid="toggle" label={pb.playing ? 'Pause' : 'Play'} primary onClick={() => (pb.done ? pb.reset() : pb.setPlaying(p => !p))}>{pb.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}</B>
      <B tid="next" label="Step forward" onClick={() => pb.step(1)}><SkipForward className="h-3.5 w-3.5" /></B>
      <B tid="end" label="Jump to end" onClick={pb.end}><ChevronsRight className="h-3.5 w-3.5" /></B>
      <div className="flex-1 min-w-[120px] px-2"><Slider data-testid={`${testid}-scrub`} value={[pb.frame]} min={0} max={Math.max(0, total - 1)} step={1} onValueChange={([v]) => { pb.setPlaying(false); pb.setFrame(v); }} /></div>
      <div className="font-mono text-[11px] text-zinc-400 tabular w-24 text-right" data-testid={`${testid}-counter`}>step {total ? pb.frame + 1 : 0}/{total}</div>
      <div className="flex items-center gap-1 border-l border-[#23312A] pl-2">
        {[0.5, 1, 2, 4].map(s => <button key={s} data-testid={`${testid}-speed-${s}`} onClick={() => pb.setSpeed(s)} className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${pb.speed === s ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-zinc-500 hover:text-zinc-200'}`}>{s}×</button>)}
      </div>
    </div>
  );
}

export function Note({ children, testid = 'pb-note' }) {
  return <div data-testid={testid} className="mt-3 font-mono text-xs text-zinc-300 rounded-md border border-[#23312A] bg-[#0B110E] px-3 py-2 min-h-[36px] flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot shrink-0" />{children}</div>;
}
