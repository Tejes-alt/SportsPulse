import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Info, SearchX } from 'lucide-react';

export const ease = [0.22, 1, 0.36, 1];
export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };
export const rise = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } } };

export const Stagger = ({ children, className, ...rest }) => (
  <motion.div variants={stagger} initial="hidden" animate="show" className={className} {...rest}>{children}</motion.div>
);
export const Rise = ({ children, className, ...rest }) => (
  <motion.div variants={rise} className={className} {...rest}>{children}</motion.div>
);

export function PageHeader({ eyebrow, icon: Icon, title, desc, right, testid }) {
  return (
    <Stagger className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4" data-testid={testid}>
      <div className="min-w-0">
        <Rise className="text-[10px] uppercase tracking-[0.22em] text-emerald-400 flex items-center gap-2 font-medium">
          {Icon && <Icon className="h-3 w-3" />}{eyebrow}
        </Rise>
        <Rise><h1 className="text-4xl sm:text-5xl font-black tracking-tight mt-1.5 leading-[1.02]">{title}</h1></Rise>
        {desc && <Rise><p className="text-zinc-500 mt-3 max-w-2xl text-sm sm:text-base leading-relaxed">{desc}</p></Rise>}
      </div>
      {right && <Rise className="shrink-0">{right}</Rise>}
    </Stagger>
  );
}

export function Card({ children, className = '', hover = true, testid, ...rest }) {
  return (
    <motion.div
      variants={rise}
      data-testid={testid}
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ duration: 0.25, ease }}
      className={`relative rounded-lg border border-[#23312A] bg-[#121815] shadow-[0_4px_20px_rgba(0,0,0,0.35)] ${hover ? 'hover:border-emerald-500/35 hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.25)]' : ''} transition-[border-color,box-shadow] duration-300 ${className}`}
      {...rest}
    >{children}</motion.div>
  );
}

export const Eyebrow = ({ children, className = '' }) => (
  <div className={`text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium ${className}`}>{children}</div>
);

export function CountUp({ value, decimals = 0, suffix = '', className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18, mass: 0.8 });
  const [txt, setTxt] = useState('0');
  useEffect(() => { if (inView && typeof value === 'number') mv.set(value); }, [inView, value, mv]);
  useEffect(() => spring.on('change', v => setTxt(v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }))), [spring, decimals]);
  if (typeof value !== 'number') return <span ref={ref} className={className}>{value ?? '—'}</span>;
  return <span ref={ref} className={className}>{txt}{suffix}</span>;
}

export function Kpi({ label, value, sub, icon: Icon, testid, decimals = 0, suffix = '', accent = false, small = false }) {
  return (
    <Card testid={testid} className={`group overflow-hidden ${small ? 'p-4' : 'p-5'}`}>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-500/[0.06] blur-xl group-hover:bg-emerald-500/[0.14] transition-colors duration-500" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>{label}</Eyebrow>
          <div className={`${small ? 'text-2xl' : 'text-3xl'} font-extrabold mt-2 font-mono tracking-tight ${accent ? 'text-emerald-400' : 'text-zinc-50'} truncate`}>
            <CountUp value={value} decimals={decimals} suffix={suffix} />
          </div>
          {sub && <div className="text-xs text-zinc-500 mt-1.5 truncate">{sub}</div>}
        </div>
        {Icon && (
          <div className="h-9 w-9 shrink-0 rounded-md border border-emerald-500/25 bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
            <Icon className="h-4 w-4 text-emerald-400" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function Seg({ options, value, onChange, testid, size = 'md' }) {
  return (
    <div className="inline-flex p-1 rounded-lg border border-[#23312A] bg-[#0B110E] relative" data-testid={testid}>
      {options.map(o => {
        const k = typeof o === 'string' ? o : o.k; const label = typeof o === 'string' ? o : o.label;
        const active = value === k;
        return (
          <button key={k} type="button" data-testid={`${testid}-${String(k).toLowerCase()}`} onClick={() => onChange(k)}
            className={`relative z-10 rounded-md font-medium transition-colors ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-1.5 text-sm'} ${active ? 'text-black' : 'text-zinc-400 hover:text-zinc-100'}`}>
            {active && <motion.span layoutId={`seg-${testid}`} className="absolute inset-0 rounded-md bg-emerald-500 shadow-[0_0_18px_-4px_rgba(16,185,129,.7)]" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Btn({ children, className = '', variant = 'primary', ...rest }) {
  const v = variant === 'primary'
    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_-6px_rgba(16,185,129,.6)]'
    : variant === 'ghost' ? 'bg-transparent hover:bg-[#161E1A] text-zinc-300 border border-[#23312A] hover:border-emerald-500/40'
    : 'bg-[#0F1614] hover:bg-[#161E1A] text-zinc-200 border border-[#23312A]';
  return (
    <motion.button whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} transition={{ duration: 0.15 }}
      className={`inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold px-4 py-2 disabled:opacity-50 disabled:pointer-events-none transition-colors ${v} ${className}`} {...rest}>
      {children}
    </motion.button>
  );
}

export function SearchBox({ value, onChange, placeholder, testid, icon: Icon, className = '', children, onKeyDown, autoFocus, big = false }) {
  return (
    <div className={`group flex items-center gap-2 bg-[#0F1614] border border-[#23312A] focus-within:border-emerald-500/60 focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] rounded-lg ${big ? 'pl-5 pr-2 py-2.5' : 'pl-4 pr-2 py-1.5'} transition-[border-color,box-shadow] duration-200 ${className}`}>
      {Icon && <Icon className={`${big ? 'h-5 w-5' : 'h-4 w-4'} text-zinc-500 group-focus-within:text-emerald-400 transition-colors`} />}
      <input data-testid={testid} value={value} autoFocus={autoFocus} onKeyDown={onKeyDown} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`flex-1 bg-transparent outline-none ${big ? 'py-1.5 text-base' : 'py-1 text-sm'} placeholder:text-zinc-600 min-w-0`} />
      {children}
    </div>
  );
}

export function Decoded({ children, keys = [], field }) {
  if (!keys.includes(field)) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 border-b border-dotted border-emerald-500/50 cursor-help" data-testid={`decoded-${field}`}>
          {children}<Info className="h-3 w-3 text-emerald-500/70" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="bg-[#0B110E] border-[#23312A] text-zinc-200 text-xs max-w-[240px]">
        Decoded from source data — the CSV stored this value as an Excel date (e.g. "May-32" → 5/32).
      </TooltipContent>
    </Tooltip>
  );
}

export function Tip({ label, children, side = 'top' }) {
  return (
    <Tooltip><TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="bg-[#0B110E] border-[#23312A] text-zinc-200 text-xs">{label}</TooltipContent></Tooltip>
  );
}

export function Empty({ title = 'Nothing here', desc, icon: Icon = SearchX, testid = 'empty-state', action }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} data-testid={testid} className="py-16 px-6 text-center">
      <div className="mx-auto h-12 w-12 rounded-lg border border-[#23312A] bg-[#0F1614] flex items-center justify-center mb-4"><Icon className="h-5 w-5 text-zinc-500" /></div>
      <div className="font-semibold text-zinc-200">{title}</div>
      {desc && <div className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">{desc}</div>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

export function SkeletonRows({ rows = 8, cols = 5 }) {
  return (
    <div className="divide-y divide-[#1A221E]" data-testid="skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-3.5" style={{ animationDelay: `${i * 60}ms` }}>
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="h-3.5 rounded bg-[#1A221E] shimmer" style={{ width: j === 1 ? '32%' : '10%', opacity: 1 - i * 0.08 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ h = 120 }) {
  return <div className="rounded-lg border border-[#23312A] bg-[#121815] shimmer" style={{ height: h }} data-testid="skeleton-card" />;
}

export function Complexity({ time, space }) {
  return (
    <div className="flex gap-2 font-mono text-[11px]">
      <span className="px-2 py-1 rounded border border-[#23312A] bg-[#0B110E] text-zinc-400">T <span className="text-emerald-400">{time}</span></span>
      <span className="px-2 py-1 rounded border border-[#23312A] bg-[#0B110E] text-zinc-400">S <span className="text-emerald-400">{space}</span></span>
    </div>
  );
}
