import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPlayers, fetchCaptains } from '../lib/api';
import { fmtInt, fmtDec } from '../lib/format';
import { PageHeader, Card, Seg, SearchBox, Empty, SkeletonRows, Decoded, Tip } from '../components/kit';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Database, Search as SearchIcon, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Info, ExternalLink } from 'lucide-react';

const SOURCES = [
  { k: 'odi_players', label: 'ODI Players', file: 'AllOdiPlayers.csv' },
  { k: 'test_players', label: 'Test Players', file: 'AllTestplayers.csv' },
  { k: 'odi_captains', label: 'ODI Captains', file: 'AllOdicaptains.csv' },
  { k: 'test_captains', label: 'Test Captains', file: 'AllTestcaptains.csv' },
];
const num = (k) => ({ k, num: true });
const COLS = {
  odi_players: [{ k: 'id', label: 'No', num: true }, { k: 'name', label: 'Name' }, num('first'), num('last'), { k: 'mat', label: 'Mat', num: true }, { k: 'inn', label: 'Inn', num: true }, { k: 'no', label: 'NO', num: true }, { k: 'runs', label: 'Runs', num: true }, { k: 'hs', label: 'HS' }, { k: 'avg', label: 'Avg', num: true, dec: true }, { k: 'balls', label: 'Balls', num: true }, { k: 'mdn', label: 'Mdn', num: true }, { k: 'bowl_runs', label: 'Runs (bowl)', num: true }, { k: 'wkt', label: 'Wkt', num: true }, { k: 'bbm', label: 'BBM' }, { k: 'bowl_avg', label: 'Avg (bowl)', num: true, dec: true }, { k: 'ca', label: 'Ct', num: true }, { k: 'st', label: 'St', num: true }],
  test_players: [{ k: 'id', label: 'Cap', num: true }, { k: 'name', label: 'Name' }, num('first'), num('last'), { k: 'mat', label: 'Mat', num: true }, { k: 'runs', label: 'Runs', num: true }, { k: 'hs', label: 'HS' }, { k: 'avg', label: 'Avg', num: true, dec: true }, { k: 'hundreds_fifties', label: '100 / 50' }, { k: 'wkt', label: 'Wkt', num: true }, { k: 'bbi', label: 'BBI' }, { k: 'bowl_avg', label: 'Bowl Avg', num: true, dec: true }, { k: 'five_ten', label: '5w / 10w' }, { k: 'ca', label: 'Ct', num: true }, { k: 'st', label: 'St', num: true }],
  odi_captains: [{ k: 'name', label: 'Captain' }, { k: 'year', label: 'Years' }, { k: 'played', label: 'Played', num: true }, { k: 'won', label: 'Won', num: true }, { k: 'lost', label: 'Lost', num: true }, { k: 'tied', label: 'Tied', num: true }, { k: 'no_result', label: 'No result', num: true }, { k: 'win_pct', label: 'Win %', num: true, dec: true }],
  test_captains: [{ k: 'name', label: 'Captain' }, { k: 'year', label: 'Years' }, { k: 'played', label: 'Played', num: true }, { k: 'won', label: 'Won', num: true }, { k: 'lost', label: 'Lost', num: true }, { k: 'tied', label: 'Drawn', num: true }, { k: 'win_pct', label: 'Win %', num: true, dec: true }],
};
COLS.odi_players[2].label = 'First'; COLS.odi_players[3].label = 'Last'; COLS.test_players[2].label = 'First'; COLS.test_players[3].label = 'Last';
const PAGE_SIZES = [25, 50, 100];

export default function Dataset() {
  const [src, setSrc] = useState('odi_players');
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ k: null, dir: 'asc' });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const cols = COLS[src];
  const isPlayers = src.endsWith('players');
  const fmt = src.startsWith('odi') ? 'ODI' : 'Test';

  useEffect(() => {
    setRows(null); setQ(''); setPage(0); setSort({ k: null, dir: 'asc' });
    const p = src === 'odi_players' ? fetchPlayers({ format: 'ODI', sort_by: 'id', order: 'asc', limit: 500 }) : src === 'test_players' ? fetchPlayers({ format: 'Test', sort_by: 'id', order: 'asc', limit: 500 }) : fetchCaptains(fmt);
    p.then(d => setRows(d.items || [])).catch(() => setRows([]));
  }, [src, fmt]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    let r = q ? rows.filter(x => (x.name || '').toLowerCase().includes(q.toLowerCase())) : [...rows];
    if (sort.k) {
      const c = cols.find(c => c.k === sort.k);
      r.sort((x, y) => {
        let a = x[sort.k], b = y[sort.k];
        if (c?.num || sort.k === 'first' || sort.k === 'last') { a = a === '' || a == null ? null : Number(a); b = b === '' || b == null ? null : Number(b); if (a === null) return 1; if (b === null) return -1; return sort.dir === 'asc' ? a - b : b - a; }
        return sort.dir === 'asc' ? String(a ?? '').localeCompare(String(b ?? '')) : String(b ?? '').localeCompare(String(a ?? ''));
      });
    }
    return r;
  }, [rows, q, sort, cols]);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const view = filtered.slice(page * size, page * size + size);
  const decodedCount = useMemo(() => (rows || []).reduce((s, r) => s + (r.decoded?.length || 0), 0), [rows]);
  const missing = useMemo(() => { if (!rows) return 0; let m = 0; rows.forEach(r => cols.forEach(c => { const v = r[c.k]; if (v === null || v === undefined || v === '') m++; })); return m; }, [rows, cols]);
  useEffect(() => setPage(0), [q, size, sort]);
  const clickSort = (k) => setSort(s => s.k === k ? { k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { k, dir: cols.find(c => c.k === k)?.num ? 'desc' : 'asc' });
  const cell = (r, c) => {
    const v = r[c.k];
    if (v === null || v === undefined || v === '') return <span className="text-zinc-700">—</span>;
    if (c.num && typeof v === 'number') return c.dec ? fmtDec(v) : fmtInt(v);
    return <Decoded keys={r.decoded} field={c.k}>{String(v)}</Decoded>;
  };
  const S = SOURCES.find(s => s.k === src);

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-10">
      <PageHeader eyebrow="Source of truth" icon={Database} title="Dataset Explorer" desc="Browse the four CSV files that power every number in SportsPulse — cleaned, typed and searchable. Dotted values were decoded from Excel-corrupted cells; hover for details." />

      <Card hover={false} className="p-3 mb-4 flex flex-col xl:flex-row gap-3 xl:items-center" testid="ds-controls">
        <div className="flex flex-wrap gap-1 p-1 rounded-lg border border-[#23312A] bg-[#0B110E]">
          {SOURCES.map(s => (
            <button key={s.k} data-testid={`ds-${s.k}`} onClick={() => setSrc(s.k)} className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${src === s.k ? 'text-black' : 'text-zinc-400 hover:text-zinc-100'}`}>
              {src === s.k && <motion.span layoutId="ds-src" className="absolute inset-0 rounded-md bg-emerald-500" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}<span className="relative z-10">{s.label}</span>
            </button>
          ))}
        </div>
        <SearchBox icon={SearchIcon} testid="ds-search" value={q} onChange={setQ} placeholder="Search by name…" className="flex-1" />
        <Select value={String(size)} onValueChange={v => setSize(Number(v))}>
          <SelectTrigger data-testid="ds-page-size" className="w-full xl:w-[130px] bg-[#0F1614] border-[#23312A] text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#0B110E] border-[#23312A]">{PAGE_SIZES.map(s => <SelectItem key={s} value={String(s)} data-testid={`ds-size-${s}`}>{s} per page</SelectItem>)}</SelectContent>
        </Select>
      </Card>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs font-mono text-zinc-500 mb-3" data-testid="ds-meta">
        <span className="text-zinc-300">{S.file}</span>
        <span><span className="text-emerald-400 font-bold">{rows ? filtered.length : '…'}</span> of {rows?.length ?? '…'} records{q && ` matching "${q}"`}</span>
        <span>{cols.length} columns</span>
        {isPlayers && <span className="flex items-center gap-1"><Info className="h-3 w-3 text-emerald-500" />{decodedCount} decoded cells</span>}
        <span>{missing} empty cells shown as —</span>
        {sort.k && <span>sorted by {cols.find(c => c.k === sort.k)?.label} {sort.dir}</span>}
      </div>

      <div className="rounded-lg border border-[#23312A] bg-[#0F1513] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
        <div className="overflow-auto scrollbar-thin max-h-[64vh]">
          <table className="w-full text-xs font-mono border-collapse" data-testid="ds-table">
            <thead className="sticky top-0 z-10 bg-[#0B110E] shadow-[0_1px_0_#23312A]">
              <tr>
                {cols.map(c => (
                  <th key={c.k} className={`p-0 ${c.num ? 'text-right' : 'text-left'}`}>
                    <button data-testid={`ds-col-${c.k}`} onClick={() => clickSort(c.k)} className={`w-full px-3 py-2.5 flex items-center gap-1 text-[10px] uppercase tracking-widest whitespace-nowrap hover:text-emerald-300 transition-colors ${c.num ? 'justify-end' : ''} ${sort.k === c.k ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {c.label}{sort.k === c.k && (sort.dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                ))}
                {isPlayers && <th className="w-8" />}
              </tr>
            </thead>
            <tbody>
              {!rows ? <tr><td colSpan={cols.length + 1}><SkeletonRows rows={10} cols={8} /></td></tr> : view.length === 0 ? <tr><td colSpan={cols.length + 1}><Empty title="No records match" desc="Try another spelling or clear the search." /></td></tr> : (
                <AnimatePresence initial={false}>
                  {view.map((r, i) => (
                    <motion.tr key={`${src}-${r.id ?? r.name}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 15) * 0.015 }} className="border-t border-[#1A221E] hover:bg-[#141B18] transition-colors group" data-testid={`ds-row-${i}`}>
                      {cols.map(c => <td key={c.k} className={`px-3 py-2 whitespace-nowrap tabular ${c.num ? 'text-right text-zinc-300' : 'text-left'} ${c.k === 'name' ? 'font-sans font-medium text-zinc-100' : ''} ${c.k === 'runs' || c.k === 'won' ? 'text-emerald-400 font-semibold' : ''}`}>{cell(r, c)}</td>)}
                      {isPlayers && <td className="px-2"><Tip label="Open profile"><Link to={`/players/${fmt}/${r.id}`} data-testid={`ds-open-${r.id}`} className="opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity"><ExternalLink className="h-3.5 w-3.5" /></Link></Tip></td>}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[#23312A] bg-[#0B110E] text-xs font-mono text-zinc-500" data-testid="ds-pagination">
          <span>Showing {filtered.length ? page * size + 1 : 0}–{Math.min(filtered.length, (page + 1) * size)} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button data-testid="ds-prev" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-7 w-7 rounded border border-[#23312A] flex items-center justify-center hover:border-emerald-500/40 disabled:opacity-30 transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
            {Array.from({ length: pages }).map((_, i) => (pages <= 7 || Math.abs(i - page) <= 1 || i === 0 || i === pages - 1) ? (
              <button key={i} data-testid={`ds-page-${i + 1}`} onClick={() => setPage(i)} className={`h-7 min-w-7 px-2 rounded border text-xs transition-colors ${i === page ? 'bg-emerald-500 text-black border-emerald-500' : 'border-[#23312A] hover:border-emerald-500/40'}`}>{i + 1}</button>
            ) : (Math.abs(i - page) === 2 ? <span key={i} className="px-1">…</span> : null))}
            <button data-testid="ds-next" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} className="h-7 w-7 rounded border border-[#23312A] flex items-center justify-center hover:border-emerald-500/40 disabled:opacity-30 transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
      <div className="mt-3 text-[11px] text-zinc-600 leading-relaxed">Cleaning rules: "-", empty and #DIV/0! → missing; trailing "*" (not out) preserved in HS; footnote markers such as "[a]" and trailing digits stripped from IDs/names; Excel-date corruption in BBM/BBI/100-50/5w-10w decoded back to wickets/runs.</div>
    </div>
  );
}
