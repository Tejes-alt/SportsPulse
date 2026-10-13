import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPlayers } from '../lib/api';
import { fmtInt, fmtDec, fmtStr, span, safeDiv, initials, TIP_STYLE } from '../lib/format';
import { PageHeader, Seg, Card, Eyebrow, Empty, Stagger, Rise, Decoded, Btn } from '../components/kit';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { GitCompare, ChevronsUpDown, ArrowLeftRight, Check, ArrowRight, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

const A_COL = '#10B981', B_COL = '#F59E0B';

function Picker({ label, players, value, onChange, testid, color }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-5" hover={false} testid={`${testid}-card`}>
      <div className="flex items-center gap-2 mb-2"><span className="h-2 w-6 rounded-sm" style={{ background: color }} /><Eyebrow>{label}</Eyebrow></div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button data-testid={`${testid}-trigger`} className="w-full flex items-center justify-between gap-3 rounded-md border border-[#23312A] bg-[#0F1614] hover:border-emerald-500/40 px-3 py-2.5 text-left transition-colors">
            {value ? (
              <span className="flex items-center gap-3 min-w-0"><span className="h-8 w-8 rounded-md border border-[#23312A] bg-[#0B110E] flex items-center justify-center text-[10px] font-bold" style={{ color }}>{initials(value.name)}</span>
                <span className="min-w-0"><span className="block font-semibold truncate">{value.name}</span><span className="block text-[10px] font-mono text-zinc-500">{value.mat} mat · {fmtInt(value.runs)} runs · {value.wkt} wkt</span></span></span>
            ) : <span className="text-zinc-500 text-sm">Select a player…</span>}
            <ChevronsUpDown className="h-4 w-4 text-zinc-500 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-[#0B110E] border-[#23312A]" align="start">
          <Command className="bg-transparent">
            <CommandInput data-testid={`${testid}-input`} placeholder="Type a name…" className="text-sm" />
            <CommandList className="max-h-72 scrollbar-thin">
              <CommandEmpty className="py-6 text-center text-sm text-zinc-500">No player found.</CommandEmpty>
              <CommandGroup>
                {players.map(p => (
                  <CommandItem key={p.id} value={`${p.name} ${p.id}`} data-testid={`${testid}-opt-${p.id}`} onSelect={() => { onChange(p); setOpen(false); }} className="flex items-center justify-between gap-2 cursor-pointer data-[selected=true]:bg-emerald-500/10 data-[selected=true]:text-emerald-200">
                    <span className="truncate">{p.name}</span>
                    <span className="font-mono text-[10px] text-zinc-500 shrink-0">{p.mat} mat · {fmtInt(p.runs)}</span>
                    {value?.id === p.id && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Card>
  );
}

function DiffRow({ label, a, b, fmt = fmtInt, higherBetter = true, decoded, field, i }) {
  const na = typeof a === 'number' ? a : null, nb = typeof b === 'number' ? b : null;
  const both = na !== null && nb !== null;
  const total = both ? Math.abs(na) + Math.abs(nb) || 1 : 1;
  const aw = both ? (Math.abs(na) / total) * 100 : 50;
  const aWins = both && na !== nb && (higherBetter ? na > nb : na < nb);
  const bWins = both && na !== nb && !aWins;
  const diff = both ? Math.abs(na - nb) : null;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5 border-b border-[#1A221E] last:border-0" data-testid={`diff-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
      <div className={`text-right font-mono font-bold tabular ${aWins ? 'text-emerald-400' : 'text-zinc-300'}`}><Decoded keys={decoded?.a} field={field}>{na !== null ? fmt(na) : fmtStr(a)}</Decoded></div>
      <div className="w-40 sm:w-56 text-center">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
        <div className="mt-1 h-1.5 rounded-full bg-[#23312A] overflow-hidden flex">
          <motion.div initial={{ width: 0 }} animate={{ width: `${aw}%` }} transition={{ duration: 0.8, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }} style={{ background: A_COL }} />
          <div className="flex-1" style={{ background: B_COL, opacity: 0.8 }} />
        </div>
        {diff !== null && <div className="text-[10px] font-mono text-zinc-600 mt-0.5">Δ {fmt(diff)}</div>}
      </div>
      <div className={`text-left font-mono font-bold tabular ${bWins ? 'text-amber-400' : 'text-zinc-300'}`}><Decoded keys={decoded?.b} field={field}>{nb !== null ? fmt(nb) : fmtStr(b)}</Decoded></div>
    </motion.div>
  );
}

export default function Compare() {
  const [sp, setSp] = useSearchParams();
  const [format, setFormat] = useState(sp.get('format') || 'ODI');
  const [players, setPlayers] = useState([]);
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const isOdi = format === 'ODI';

  useEffect(() => {
    fetchPlayers({ format, sort_by: 'runs', order: 'desc', limit: 500 }).then(d => {
      const items = d.items || []; setPlayers(items);
      const pa = items.find(p => String(p.id) === sp.get('a')), pb = items.find(p => String(p.id) === sp.get('b'));
      setA(pa || null); setB(pb || null);
    }).catch(() => {});
    // eslint-disable-next-line
  }, [format]);
  useEffect(() => { const n = { format }; if (a) n.a = a.id; if (b) n.b = b.id; setSp(n, { replace: true }); }, [a, b, format, setSp]);

  const changeFormat = (f) => { setFormat(f); setA(null); setB(null); };
  const swap = () => { setA(b); setB(a); };

  const rows = a && b ? [
    { label: 'Matches', a: a.mat, b: b.mat },
    { label: 'Runs', a: a.runs, b: b.runs },
    { label: 'Batting average', a: a.avg, b: b.avg, fmt: v => fmtDec(v) },
    { label: 'Highest score', a: a.hs_value, b: b.hs_value, fmt: (v) => v === a.hs_value && a.hs?.includes('*') ? a.hs : v === b.hs_value && b.hs?.includes('*') ? b.hs : String(v) },
    ...(isOdi ? [{ label: 'Innings', a: a.inn, b: b.inn }, { label: 'Not outs', a: a.no, b: b.no }] : [{ label: '100s / 50s', a: a.hundreds_fifties, b: b.hundreds_fifties, field: 'hundreds_fifties' }]),
    { label: 'Runs per match', a: safeDiv(a.runs, a.mat), b: safeDiv(b.runs, b.mat), fmt: v => fmtDec(v) },
    { label: 'Wickets', a: a.wkt, b: b.wkt },
    { label: 'Bowling average', a: a.bowl_avg, b: b.bowl_avg, fmt: v => fmtDec(v), higherBetter: false },
    ...(isOdi ? [{ label: 'Best bowling', a: a.bbm, b: b.bbm, field: 'bbm' }, { label: 'Balls bowled', a: a.balls, b: b.balls }, { label: 'Maidens', a: a.mdn, b: b.mdn }] : [{ label: 'Best innings bowling', a: a.bbi, b: b.bbi, field: 'bbi' }, { label: '5w / 10w', a: a.five_ten, b: b.five_ten, field: 'five_ten' }]),
    { label: 'Catches', a: a.ca, b: b.ca },
    { label: 'Stumpings', a: a.st, b: b.st },
  ] : [];

  const chart = a && b ? [
    { m: 'Matches', [a.name]: a.mat, [b.name]: b.mat }, { m: 'Runs ÷ 10', [a.name]: +(a.runs / 10).toFixed(1), [b.name]: +(b.runs / 10).toFixed(1) },
    { m: 'Average', [a.name]: a.avg ?? 0, [b.name]: b.avg ?? 0 }, { m: 'Wickets', [a.name]: a.wkt, [b.name]: b.wkt }, { m: 'Catches', [a.name]: a.ca, [b.name]: b.ca },
  ] : [];
  const maxOf = (k) => Math.max(1, ...players.map(p => p[k] || 0));
  const radar = a && b ? [
    { m: 'Runs', A: Math.round(a.runs / maxOf('runs') * 100), B: Math.round(b.runs / maxOf('runs') * 100) },
    { m: 'Average', A: Math.round((a.avg || 0) / maxOf('avg') * 100), B: Math.round((b.avg || 0) / maxOf('avg') * 100) },
    { m: 'Wickets', A: Math.round(a.wkt / maxOf('wkt') * 100), B: Math.round(b.wkt / maxOf('wkt') * 100) },
    { m: 'Matches', A: Math.round(a.mat / maxOf('mat') * 100), B: Math.round(b.mat / maxOf('mat') * 100) },
    { m: 'Catches', A: Math.round(a.ca / maxOf('ca') * 100), B: Math.round(b.ca / maxOf('ca') * 100) },
    { m: 'High score', A: Math.round((a.hs_value || 0) / maxOf('hs_value') * 100), B: Math.round((b.hs_value || 0) / maxOf('hs_value') * 100) },
  ] : [];
  const wins = rows.reduce((acc, r) => { if (typeof r.a === 'number' && typeof r.b === 'number' && r.a !== r.b) { const hb = r.higherBetter !== false; (hb ? r.a > r.b : r.a < r.b) ? acc.a++ : acc.b++; } return acc; }, { a: 0, b: 0 });

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
      <PageHeader eyebrow="Head-to-head" icon={GitCompare} title="Player Comparison" desc="Pick any two players from the same format. Every figure is read directly from the dataset — differences are computed, never estimated."
        right={<Seg testid="cmp-fmt" value={format} onChange={changeFormat} options={['ODI', 'Test']} />} />

      <Stagger className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-8">
        <Picker label="Player A" players={players} value={a} onChange={setA} testid="cmp-a" color={A_COL} />
        <Rise className="flex justify-center">
          <button data-testid="cmp-swap" onClick={swap} disabled={!a && !b} className="h-11 w-11 rounded-full border border-[#23312A] bg-[#0F1614] hover:border-emerald-500/50 hover:rotate-180 disabled:opacity-40 flex items-center justify-center transition-all duration-300"><ArrowLeftRight className="h-4 w-4 text-emerald-400" /></button>
        </Rise>
        <Picker label="Player B" players={players} value={b} onChange={setB} testid="cmp-b" color={B_COL} />
      </Stagger>

      <AnimatePresence mode="wait">
        {a && b ? (
          <motion.div key={`${a.id}-${b.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-4" data-testid="compare-results">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[{ p: a, c: A_COL, k: 'a', w: wins.a }, { p: b, c: B_COL, k: 'b', w: wins.b }].map(({ p, c, k, w }) => (
                <Card key={k} className="p-5 overflow-hidden" testid={`cmp-summary-${k}`}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: c }} />
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-lg border flex items-center justify-center text-lg font-black" style={{ borderColor: `${c}66`, background: `${c}14`, color: c }}>{initials(p.name)}</div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/players/${format}/${p.id}`} className="text-2xl font-extrabold tracking-tight hover:text-emerald-300 transition-colors truncate block" data-testid={`cmp-name-${k}`}>{p.name}</Link>
                      <div className="text-xs font-mono text-zinc-500">{format} cap #{p.id} · {span(p)} · {p.mat} matches</div>
                    </div>
                    <div className="text-right"><div className="text-[10px] uppercase tracking-widest text-zinc-500">Metrics led</div><div className="text-3xl font-black font-mono tabular" style={{ color: c }}>{w}</div></div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6" hover={false} testid="diff-table">
              <div className="flex items-center justify-between mb-2"><div><Eyebrow>Side by side</Eyebrow><h3 className="text-lg font-bold mt-1">Statistical breakdown</h3></div>
                <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-3"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: A_COL }} />{a.name}</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: B_COL }} />{b.name}</span></div></div>
              {rows.map((r, i) => <DiffRow key={r.label} i={i} {...r} decoded={{ a: a.decoded, b: b.decoded }} />)}
              <div className="text-[10px] text-zinc-600 mt-3">Highlighted value leads the metric (lower is better for bowling average). Δ = absolute difference.</div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-6" testid="cmp-bar">
                <Eyebrow>Metric comparison</Eyebrow><h3 className="text-lg font-bold mt-1 mb-2">Grouped bars</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chart} margin={{ left: -15 }}>
                    <CartesianGrid stroke="#23312A" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="m" stroke="#6B7280" fontSize={11} tickLine={false} /><YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TIP_STYLE} cursor={{ fill: 'rgba(16,185,129,0.05)' }} /><Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey={a.name} fill={A_COL} radius={[4, 4, 0, 0]} animationDuration={900} /><Bar dataKey={b.name} fill={B_COL} radius={[4, 4, 0, 0]} animationDuration={900} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card className="p-6" testid="cmp-radar">
                <Eyebrow>Normalized profile</Eyebrow><h3 className="text-lg font-bold mt-1 mb-2">Radar · % of {format} dataset max</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radar}>
                    <PolarGrid stroke="#23312A" /><PolarAngleAxis dataKey="m" tick={{ fill: '#9CA3AF', fontSize: 11 }} /><PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                    <Radar name={a.name} dataKey="A" stroke={A_COL} fill={A_COL} fillOpacity={0.35} animationDuration={900} /><Radar name={b.name} dataKey="B" stroke={B_COL} fill={B_COL} fillOpacity={0.25} animationDuration={900} />
                    <Legend wrapperStyle={{ fontSize: 12 }} /><Tooltip contentStyle={TIP_STYLE} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card hover={false}><Empty icon={Users} title={a || b ? 'Select the second player' : 'Select two players to compare'} desc={`Choose from ${players.length} ${format} players. Try Sachin Tendulkar vs Virat Kohli.`}
              action={!a && players.length > 1 && <Btn variant="ghost" data-testid="cmp-quick-pick" onClick={() => { setA(players[0]); setB(players[1]); }}>Compare top two run-scorers <ArrowRight className="h-4 w-4" /></Btn>} /></Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
