import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCaptains, lookupPlayer } from '../lib/api';
import { fmtInt, shortName, TIP_STYLE } from '../lib/format';
import { PageHeader, Seg, Card, Eyebrow, Kpi, Stagger, SkeletonRows, Empty, Tip } from '../components/kit';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Crown, Trophy, Percent, Swords, ChevronUp, ChevronDown, ExternalLink, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';

const AC = '#10B981', RED = '#EF4444', AMBER = '#F59E0B', BLUE = '#3B82F6', GREY = '#6B7280';
const MIN = [{ k: 0, label: 'All captains' }, { k: 10, label: '10+ matches' }, { k: 20, label: '20+ matches' }, { k: 50, label: '50+ matches' }];

export default function Captains() {
  const [format, setFormat] = useState('ODI');
  const [caps, setCaps] = useState(null);
  const [minPlayed, setMinPlayed] = useState(10);
  const [sort, setSort] = useState({ k: 'played', dir: 'desc' });
  const [links, setLinks] = useState({});
  const isOdi = format === 'ODI';

  useEffect(() => { setCaps(null); fetchCaptains(format).then(d => setCaps(d.items || [])).catch(() => setCaps([])); }, [format]);
  useEffect(() => {
    if (!caps) return;
    Promise.all(caps.map(c => lookupPlayer(c.name).then(r => [c.name, r.find(x => x.format === format) || r[0] || null]).catch(() => [c.name, null])))
      .then(entries => setLinks(Object.fromEntries(entries)));
  }, [caps, format]);

  const pool = useMemo(() => (caps || []).filter(c => c.played >= minPlayed), [caps, minPlayed]);
  const totals = useMemo(() => (caps || []).reduce((t, c) => ({ played: t.played + c.played, won: t.won + c.won, lost: t.lost + c.lost, tied: t.tied + c.tied, nr: t.nr + c.no_result }), { played: 0, won: 0, lost: 0, tied: 0, nr: 0 }), [caps]);
  const most = useMemo(() => pool.reduce((m, c) => (c.played > (m?.played || 0) ? c : m), null), [pool]);
  const mostWins = useMemo(() => pool.reduce((m, c) => (c.won > (m?.won || 0) ? c : m), null), [pool]);
  const bestPct = useMemo(() => pool.reduce((m, c) => (c.win_pct > (m?.win_pct || -1) ? c : m), null), [pool]);
  const stacked = useMemo(() => [...pool].sort((a, b) => b.played - a.played).slice(0, 12).map(c => ({ name: shortName(c.name), Won: c.won, Lost: c.lost, [isOdi ? 'Tied' : 'Drawn']: c.tied, 'No result': c.no_result })), [pool, isOdi]);
  const winChart = useMemo(() => [...pool].sort((a, b) => b.win_pct - a.win_pct).slice(0, 12).map(c => ({ name: shortName(c.name), win: c.win_pct, played: c.played })), [pool]);
  const timeline = useMemo(() => pool.filter(c => c.start_year).map(c => ({ x: c.start_year, y: c.win_pct, z: c.played, name: c.name, year: c.year })), [pool]);
  const table = useMemo(() => [...pool].sort((a, b) => { const A = a[sort.k], B = b[sort.k]; if (typeof A === 'string') return sort.dir === 'asc' ? A.localeCompare(B) : B.localeCompare(A); return sort.dir === 'asc' ? A - B : B - A; }), [pool, sort]);
  const clickSort = (k) => setSort(s => s.k === k ? { k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { k, dir: k === 'name' || k === 'start_year' ? 'asc' : 'desc' });
  const COLS = [{ k: 'name', label: 'Captain' }, { k: 'start_year', label: 'Tenure' }, { k: 'played', label: 'Played', n: 1 }, { k: 'won', label: 'Won', n: 1 }, { k: 'lost', label: 'Lost', n: 1 }, { k: 'tied', label: isOdi ? 'Tied' : 'Drawn', n: 1 }, ...(isOdi ? [{ k: 'no_result', label: 'No result', n: 1 }] : []), { k: 'win_pct', label: 'Win %', n: 1 }];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
      <PageHeader eyebrow="Leadership" icon={Crown} title="Captain Analytics" desc={`Every Indian ${format} captain in the dataset — matches led, results and win rate. Win % is taken from the source file; tenure is read from the Year column.`}
        right={<div className="flex flex-wrap gap-2 items-center">
          <Select value={String(minPlayed)} onValueChange={v => setMinPlayed(Number(v))}><SelectTrigger data-testid="cap-min" className="w-[160px] bg-[#0F1614] border-[#23312A] text-sm"><SelectValue /></SelectTrigger><SelectContent className="bg-[#0B110E] border-[#23312A]">{MIN.map(m => <SelectItem key={m.k} value={String(m.k)} data-testid={`cap-min-${m.k}`}>{m.label}</SelectItem>)}</SelectContent></Select>
          <Seg testid="cap-fmt" value={format} onChange={setFormat} options={['ODI', 'Test']} />
        </div>} />

      {!caps ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-lg border border-[#23312A] bg-[#121815] shimmer" />)}</div> : (
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6" key={format}>
          <Kpi testid="cap-kpi-captains" label={`${format} captains`} value={caps.length} sub={`${pool.length} with ${minPlayed}+ matches`} icon={Users} />
          <Kpi testid="cap-kpi-matches" label="Matches led" value={totals.played} sub={`${totals.won} won · ${totals.lost} lost · ${totals.tied} ${isOdi ? 'tied' : 'drawn'}${isOdi ? ` · ${totals.nr} NR` : ''}`} icon={Swords} />
          <Kpi testid="cap-kpi-winpct" label="Aggregate win %" value={totals.played ? +(totals.won / totals.played * 100).toFixed(2) : 0} decimals={2} suffix="%" sub="all captains combined" icon={Percent} accent />
          <Kpi testid="cap-kpi-most" label="Most matches" value={most?.played ?? 0} sub={most?.name ?? '—'} icon={Trophy} />
        </Stagger>
      )}

      {caps && (
        <Stagger className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6" key={`${format}-lead`}>
          {[{ l: 'Most wins', c: mostWins, v: mostWins ? `${mostWins.won} wins in ${mostWins.played}` : '—', testid: 'lead-wins' }, { l: `Best win % (${minPlayed}+ matches)`, c: bestPct, v: bestPct ? `${bestPct.win_pct}% · ${bestPct.won}/${bestPct.played}` : '—', testid: 'lead-pct' }, { l: 'Longest tenure', c: pool.reduce((m, c) => { const yrs = (s) => { const m2 = s.year.match(/(\d{4}).*?(\d{4}|still|present)/i); if (!m2) return 0; const end = /\d{4}/.test(m2[2]) ? Number(m2[2]) : 2021; return end - Number(m2[1]); }; return yrs(c) > (m ? yrs(m) : -1) ? c : m; }, null), v: null, testid: 'lead-tenure' }].map(({ l, c, v, testid }) => (
            <Card key={l} className="p-5" testid={testid}>
              <div className="flex items-center justify-between"><Eyebrow>{l}</Eyebrow><Crown className="h-4 w-4 text-amber-400" /></div>
              <div className="text-2xl font-black mt-2 truncate">{c ? (links[c.name] ? <Link to={`/players/${links[c.name].format}/${links[c.name].id}`} className="hover:text-emerald-300 transition-colors">{c.name}</Link> : c.name) : '—'}</div>
              <div className="text-xs text-zinc-500 mt-1 font-mono">{v ?? (c ? c.year : '—')}</div>
            </Card>
          ))}
        </Stagger>
      )}

      <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6" key={`${format}-charts`}>
        <Card className="p-6" testid="cap-chart-stacked">
          <Eyebrow>Results breakdown · top 12 by matches</Eyebrow><h3 className="text-lg font-bold mt-1 mb-3">Won / lost / {isOdi ? 'tied / no result' : 'drawn'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stacked} margin={{ left: -15, bottom: 10 }}>
              <CartesianGrid stroke="#23312A" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} angle={-30} textAnchor="end" height={60} interval={0} />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TIP_STYLE} cursor={{ fill: 'rgba(16,185,129,0.05)' }} /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Won" stackId="a" fill={AC} animationDuration={900} /><Bar dataKey="Lost" stackId="a" fill={RED} fillOpacity={0.75} animationDuration={900} />
              <Bar dataKey={isOdi ? 'Tied' : 'Drawn'} stackId="a" fill={isOdi ? AMBER : BLUE} animationDuration={900} />{isOdi && <Bar dataKey="No result" stackId="a" fill={GREY} radius={[3, 3, 0, 0]} animationDuration={900} />}
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6" testid="cap-chart-win">
          <Eyebrow>Win rate · top 12 ({minPlayed}+ matches)</Eyebrow><h3 className="text-lg font-bold mt-1 mb-3">Captaincy win %</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={winChart} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid stroke="#23312A" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} width={95} />
              <Tooltip contentStyle={TIP_STYLE} formatter={(v, n, p) => [`${v}% over ${p.payload.played} matches`, 'Win rate']} />
              <Bar dataKey="win" radius={[0, 4, 4, 0]} animationDuration={1000} label={{ position: 'right', fill: '#9CA3AF', fontSize: 10, formatter: v => `${v}%` }}>{winChart.map((d, i) => <Cell key={i} fill={i === 0 ? '#34D399' : AC} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6 lg:col-span-2" testid="cap-chart-timeline">
          <Eyebrow>Timeline</Eyebrow><h3 className="text-lg font-bold mt-1 mb-3">Win % by start of tenure · bubble size = matches led</h3>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ left: -15, right: 20 }}>
              <CartesianGrid stroke="#23312A" strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" domain={['dataMin - 2', 'dataMax + 2']} stroke="#6B7280" fontSize={11} tickLine={false} tickCount={10} />
              <YAxis type="number" dataKey="y" domain={[0, 100]} stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
              <ZAxis type="number" dataKey="z" range={[40, 600]} />
              <Tooltip contentStyle={TIP_STYLE} cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? <div style={TIP_STYLE} className="p-2.5"><div className="font-semibold">{payload[0].payload.name}</div><div className="text-zinc-400 font-mono text-[11px]">{payload[0].payload.year} · {payload[0].payload.z} matches · {payload[0].payload.y}% won</div></div> : null} />
              <Scatter data={timeline} fill={AC} fillOpacity={0.55} stroke="#34D399" animationDuration={900} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </Stagger>

      <div className="rounded-lg border border-[#23312A] bg-[#0F1513] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
        <div className="overflow-auto scrollbar-thin max-h-[70vh]">
          <table className="w-full text-sm font-mono" data-testid="cap-table">
            <thead className="sticky top-0 bg-[#0B110E] shadow-[0_1px_0_#23312A] z-10">
              <tr>{COLS.map(c => <th key={c.k} className="p-0"><button data-testid={`cap-col-${c.k}`} onClick={() => clickSort(c.k)} className={`w-full px-3 py-2.5 flex items-center gap-1 text-[10px] uppercase tracking-widest whitespace-nowrap hover:text-emerald-300 ${c.n ? 'justify-end' : ''} ${sort.k === c.k ? 'text-emerald-400' : 'text-zinc-500'}`}>{c.label}{sort.k === c.k && (sort.dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</button></th>)}<th className="w-24 px-3 text-[10px] uppercase tracking-widest text-zinc-500 text-left">Form</th><th className="w-8" /></tr>
            </thead>
            <tbody>
              {!caps ? <tr><td colSpan={COLS.length + 2}><SkeletonRows rows={8} cols={7} /></td></tr> : table.length === 0 ? <tr><td colSpan={COLS.length + 2}><Empty title="No captains match the filter" /></td></tr> : (
                <AnimatePresence initial={false}>{table.map((c, i) => (
                  <motion.tr key={c.name} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 12) * 0.02 }} data-testid={`cap-row-${i}`} className="border-t border-[#1A221E] hover:bg-[#141B18] transition-colors group">
                    <td className="px-3 py-2.5 font-sans font-semibold text-zinc-100">{links[c.name] ? <Link to={`/players/${links[c.name].format}/${links[c.name].id}`} className="hover:text-emerald-300 transition-colors">{c.name}</Link> : c.name}</td>
                    <td className="px-3 py-2.5 text-zinc-400 text-xs whitespace-nowrap">{c.year}</td>
                    <td className="px-3 py-2.5 text-right tabular">{c.played}</td>
                    <td className="px-3 py-2.5 text-right tabular text-emerald-400 font-bold">{c.won}</td>
                    <td className="px-3 py-2.5 text-right tabular text-red-300">{c.lost}</td>
                    <td className="px-3 py-2.5 text-right tabular text-zinc-400">{c.tied}</td>
                    {isOdi && <td className="px-3 py-2.5 text-right tabular text-zinc-500">{c.no_result}</td>}
                    <td className="px-3 py-2.5 text-right tabular font-bold text-emerald-300">{c.win_pct}%</td>
                    <td className="px-3 py-2.5"><Tip label={`${c.won}W · ${c.lost}L · ${c.tied}${isOdi ? 'T' : 'D'}${isOdi ? ` · ${c.no_result}NR` : ''}`}><div className="h-1.5 w-20 rounded-full overflow-hidden flex bg-[#23312A]">{c.played > 0 && <><motion.div initial={{ width: 0 }} animate={{ width: `${c.won / c.played * 100}%` }} transition={{ duration: 0.7 }} className="bg-emerald-500" /><div style={{ width: `${c.lost / c.played * 100}%` }} className="bg-red-500/70" /><div style={{ width: `${c.tied / c.played * 100}%` }} className={isOdi ? 'bg-amber-500' : 'bg-sky-500/80'} /></>}</div></Tip></td>
                    <td className="px-2">{links[c.name] && <Link to={`/players/${links[c.name].format}/${links[c.name].id}`} data-testid={`cap-open-${i}`} className="opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity"><ExternalLink className="h-3.5 w-3.5" /></Link>}</td>
                  </motion.tr>
                ))}</AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-[#23312A] bg-[#0B110E] text-[11px] font-mono text-zinc-500">{table.length} captains · {fmtInt(table.reduce((s, c) => s + c.played, 0))} matches · captains linked to their player profile where a name match exists</div>
      </div>
    </div>
  );
}
