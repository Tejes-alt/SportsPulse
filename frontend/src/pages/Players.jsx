import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPlayers } from '../lib/api';
import { fmtInt, fmtDec, span, initials } from '../lib/format';
import { PageHeader, Seg, SearchBox, Empty, SkeletonRows, Card, Tip } from '../components/kit';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, ArrowUpDown, ArrowRight, Users, ChevronUp, ChevronDown, LayoutList, LayoutGrid, GitCompare } from 'lucide-react';

const ROLES = [{ k: '', label: 'All roles' }, { k: 'batting', label: 'Batters · 1000+ runs' }, { k: 'bowling', label: 'Bowlers · 50+ wkts' }, { k: 'allround', label: 'All-rounders' }, { k: 'keeper', label: 'Wicket-keepers' }];
const MIN_MAT = [{ k: 0, label: 'Any matches' }, { k: 10, label: '10+ matches' }, { k: 50, label: '50+ matches' }, { k: 100, label: '100+ matches' }];
const COLS = [
  { k: 'name', label: 'Player', cls: 'col-span-4 text-left' },
  { k: 'mat', label: 'Mat', cls: 'col-span-1 text-right' },
  { k: 'runs', label: 'Runs', cls: 'col-span-2 text-right' },
  { k: 'avg', label: 'Avg', cls: 'col-span-1 text-right' },
  { k: 'wkt', label: 'Wkt', cls: 'col-span-1 text-right' },
  { k: 'ca', label: 'Ct', cls: 'col-span-1 text-right' },
  { k: 'first', label: 'Career', cls: 'col-span-2 text-right' },
];

function Row({ p, i, format, max }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, delay: Math.min(i, 12) * 0.02 }}>
      <Link to={`/players/${format}/${p.id}`} data-testid={`player-row-${p.id}`} className="relative grid grid-cols-12 px-5 py-2.5 items-center hover:bg-[#141B18] transition-colors group overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/[0.04] pointer-events-none" style={{ width: `${(p.runs / max) * 100}%` }} />
        <div className="col-span-4 flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-md bg-[#0B110E] border border-[#23312A] flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0 group-hover:border-emerald-500/40 transition-colors">{initials(p.name)}</div>
          <div className="min-w-0"><div className="font-medium truncate group-hover:text-emerald-300 transition-colors">{p.name}</div><div className="text-[10px] font-mono text-zinc-500">#{p.id} · {format} cap</div></div>
        </div>
        <div className="col-span-1 text-right font-mono text-sm tabular">{p.mat}</div>
        <div className="col-span-2 text-right font-mono text-emerald-400 font-semibold tabular">{fmtInt(p.runs)}</div>
        <div className="col-span-1 text-right font-mono text-sm text-zinc-400 tabular">{fmtDec(p.avg)}</div>
        <div className="col-span-1 text-right font-mono text-sm text-zinc-400 tabular">{p.wkt}</div>
        <div className="col-span-1 text-right font-mono text-sm text-zinc-400 tabular">{p.ca}</div>
        <div className="col-span-2 text-right font-mono text-xs text-zinc-500 flex items-center justify-end gap-1.5">{span(p)}<ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 text-emerald-400 transition-all" /></div>
      </Link>
    </motion.div>
  );
}

function PlayerCard({ p, i, format }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.22, delay: Math.min(i, 12) * 0.025 }}>
      <Link to={`/players/${format}/${p.id}`} data-testid={`player-card-${p.id}`} className="group block rounded-lg border border-[#23312A] bg-[#121815] p-4 hover:border-emerald-500/40 hover:-translate-y-0.5 hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.3)] transition-all duration-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-[#0B110E] border border-[#23312A] flex items-center justify-center text-xs font-bold text-emerald-400 group-hover:border-emerald-500/40">{initials(p.name)}</div>
          <div className="min-w-0"><div className="font-semibold truncate group-hover:text-emerald-300 transition-colors">{p.name}</div><div className="text-[10px] font-mono text-zinc-500">{span(p)} · {p.mat} mat</div></div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 font-mono">
          {[['Runs', fmtInt(p.runs)], ['Avg', fmtDec(p.avg)], ['Wkt', p.wkt]].map(([l, v]) => <div key={l}><div className="text-[9px] uppercase tracking-widest text-zinc-500">{l}</div><div className="text-sm font-bold tabular">{v}</div></div>)}
        </div>
      </Link>
    </motion.div>
  );
}

export default function Players() {
  const [sp, setSp] = useSearchParams();
  const [format, setFormat] = useState(sp.get('format') || 'ODI');
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('runs');
  const [order, setOrder] = useState('desc');
  const [role, setRole] = useState('');
  const [minMat, setMinMat] = useState(0);
  const [view, setView] = useState('table');
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    const t = setTimeout(() => fetchPlayers({ format, q, sort_by: sortBy, order, limit: 500, min_mat: minMat, role }).then(setData).catch(() => setData({ items: [], total: 0 })), 120);
    return () => clearTimeout(t);
  }, [format, q, sortBy, order, role, minMat]);
  useEffect(() => { setSp({ format }, { replace: true }); }, [format, setSp]);

  const max = useMemo(() => Math.max(1, ...(data?.items || []).map(p => p.runs)), [data]);
  const sortCol = (k) => { if (sortBy === k) setOrder(o => o === 'desc' ? 'asc' : 'desc'); else { setSortBy(k); setOrder(k === 'name' || k === 'first' ? 'asc' : 'desc'); } };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
      <PageHeader eyebrow="Explorer" icon={Users} title="Player Database" desc="Search, filter and sort every ODI and Test cap in the archive. Click any row for a full career profile."
        right={<Link to="/compare" data-testid="players-compare-link" className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md border border-[#23312A] bg-[#0F1614] hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-300 transition-colors"><GitCompare className="h-4 w-4" /> Compare players</Link>} />

      <Card hover={false} className="p-3 mb-5 flex flex-col lg:flex-row gap-3 lg:items-center" testid="players-controls">
        <SearchBox icon={Search} testid="players-search" value={q} onChange={setQ} placeholder="Filter by name…" className="flex-1" />
        <Seg testid="fmt" value={format} onChange={setFormat} options={['ODI', 'Test']} />
        <Select value={role} onValueChange={v => setRole(v === 'all' ? '' : v)}>
          <SelectTrigger data-testid="role-filter" className="w-full lg:w-[200px] bg-[#0F1614] border-[#23312A] text-sm"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent className="bg-[#0B110E] border-[#23312A]">{ROLES.map(r => <SelectItem key={r.k || 'all'} value={r.k || 'all'} data-testid={`role-${r.k || 'all'}`}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(minMat)} onValueChange={v => setMinMat(Number(v))}>
          <SelectTrigger data-testid="minmat-filter" className="w-full lg:w-[160px] bg-[#0F1614] border-[#23312A] text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#0B110E] border-[#23312A]">{MIN_MAT.map(m => <SelectItem key={m.k} value={String(m.k)} data-testid={`minmat-${m.k}`}>{m.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger data-testid="sort-by" className="w-full lg:w-[150px] bg-[#0F1614] border-[#23312A] text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#0B110E] border-[#23312A]">{COLS.map(c => <SelectItem key={c.k} value={c.k} data-testid={`sort-${c.k}`}>Sort · {c.label}</SelectItem>)}</SelectContent>
        </Select>
        <Tip label={order === 'desc' ? 'Descending' : 'Ascending'}>
          <button data-testid="sort-order" onClick={() => setOrder(o => o === 'desc' ? 'asc' : 'desc')} className="bg-[#0F1614] border border-[#23312A] hover:border-emerald-500/40 rounded-md px-3 py-2 text-sm inline-flex items-center gap-1.5 font-mono transition-colors"><ArrowUpDown className="h-3.5 w-3.5" />{order.toUpperCase()}</button>
        </Tip>
        <Seg size="sm" testid="view" value={view} onChange={setView} options={[{ k: 'table', label: <LayoutList className="h-3.5 w-3.5" /> }, { k: 'cards', label: <LayoutGrid className="h-3.5 w-3.5" /> }]} />
      </Card>

      <div className="flex items-center justify-between text-xs text-zinc-500 mb-3 font-mono" data-testid="players-count">
        <span>{data ? <><span className="text-emerald-400 font-bold">{data.total}</span> {format} players{q && <> matching "<span className="text-zinc-300">{q}</span>"</>}</> : 'Loading…'}</span>
        <span>sorted by {COLS.find(c => c.k === sortBy)?.label.toLowerCase()} · {order}</span>
      </div>

      {view === 'table' ? (
        <div className="rounded-lg border border-[#23312A] bg-[#0F1513] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
          <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500 border-b border-[#23312A] bg-[#0B110E] select-none">
            {COLS.map(c => (
              <button key={c.k} data-testid={`col-${c.k}`} onClick={() => sortCol(c.k)} className={`${c.cls} flex items-center gap-1 hover:text-emerald-300 transition-colors ${c.cls.includes('right') ? 'justify-end' : ''} ${sortBy === c.k ? 'text-emerald-400' : ''}`}>
                {c.label}{sortBy === c.k && (order === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
              </button>
            ))}
          </div>
          <div className="max-h-[68vh] overflow-y-auto scrollbar-thin divide-y divide-[#1A221E]">
            {!data ? <SkeletonRows rows={10} cols={6} /> : data.items.length === 0 ? <Empty title="No players match" desc="Try clearing the role/minimum-match filters or check the spelling. Smart Search can fix typos." action={<Link to={`/search?q=${encodeURIComponent(q)}`} className="text-emerald-400 text-sm hover:underline">Try fuzzy search →</Link>} /> : (
              <AnimatePresence mode="popLayout" initial={false}>{data.items.map((p, i) => <Row key={p.id} p={p} i={i} format={format} max={max} />)}</AnimatePresence>
            )}
          </div>
        </div>
      ) : (
        !data ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 rounded-lg border border-[#23312A] bg-[#121815] shimmer" />)}</div>
          : data.items.length === 0 ? <Empty title="No players match" /> : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" data-testid="players-cards">
              <AnimatePresence mode="popLayout" initial={false}>{data.items.map((p, i) => <PlayerCard key={p.id} p={p} i={i} format={format} />)}</AnimatePresence>
            </motion.div>
          )
      )}
    </div>
  );
}
