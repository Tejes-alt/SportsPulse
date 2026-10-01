import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchOverview, fetchTop, fetchCaptains, fetchNames } from '../lib/api';
import { Trie, fuzzySearch } from '../lib/algorithms';
import { fmtInt, fmtDec, TIP_STYLE, shortName } from '../lib/format';
import { Stagger, Rise, Card, Kpi, Eyebrow, SearchBox, Seg, SkeletonCard, CountUp } from '../components/kit';
import { NAV } from '../components/Layout';
import { Search, ArrowRight, Users, Trophy, Zap, Crown, Target, TrendingUp, Database, Shield, Sparkles, CornerDownLeft, Hand, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, Legend } from 'recharts';

const AC = '#10B981', LIME = '#A3E635', AMBER = '#F59E0B', RED = '#EF4444', BLUE = '#3B82F6';

function HeroSearch({ names }) {
  const [q, setQ] = useState(''); const [open, setOpen] = useState(false); const [idx, setIdx] = useState(0);
  const nav = useNavigate(); const wrap = useRef(null);
  const trie = useMemo(() => { const t = new Trie(); t.insertMany(names); return t; }, [names]);
  const sug = useMemo(() => {
    if (!q.trim()) return [];
    const pre = trie.autocomplete(q.trim(), 5).map(n => ({ name: n, via: 'Trie prefix' }));
    if (pre.length >= 3) return pre;
    const fz = fuzzySearch(q.trim(), names, 5).filter(f => !pre.some(p => p.name === f.name)).map(f => ({ name: f.name, via: `Wagner-Fischer · d=${f.distance}` }));
    return [...pre, ...fz].slice(0, 6);
  }, [q, trie, names]);
  useEffect(() => { const h = e => { if (!wrap.current?.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const go = (name) => nav(`/search?q=${encodeURIComponent(name || q.trim())}`);
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, sug.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (open && sug[idx]) go(sug[idx].name); else if (q.trim()) go(); }
    else if (e.key === 'Escape') setOpen(false);
  };
  return (
    <div ref={wrap} className="relative mt-8 max-w-2xl">
      <SearchBox big icon={Search} testid="hero-search-input" value={q} onChange={v => { setQ(v); setOpen(true); setIdx(0); }} onKeyDown={onKey}
        placeholder="Search any player — try 'Viraat Kohli' or 'Tendlkar'">
        <button data-testid="hero-search-btn" onClick={() => q.trim() && go()} className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black text-sm font-semibold px-4 py-2 rounded-md transition-all inline-flex items-center gap-1.5">
          Run Search <CornerDownLeft className="h-3.5 w-3.5" />
        </button>
      </SearchBox>
      <AnimatePresence>
        {open && sug.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.16 }}
            className="absolute z-30 mt-2 w-full rounded-lg border border-[#23312A] bg-[#0B110E]/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,.8)] overflow-hidden" data-testid="hero-suggestions">
            {sug.map((s, i) => (
              <li key={s.name}>
                <button data-testid={`hero-sug-${i}`} onMouseEnter={() => setIdx(i)} onClick={() => go(s.name)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${i === idx ? 'bg-emerald-500/10 text-emerald-200' : 'text-zinc-300'}`}>
                  <span className="font-medium">{s.name}</span>
                  <span className="font-mono text-[10px] text-zinc-500">{s.via}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <div className="flex flex-wrap items-center gap-2 mt-3 pl-1 text-[11px] text-zinc-500">
        <span>Try:</span>
        {['Viraat Kohli', 'Tendlkar', 'Dhoni', 'Kapil'].map(s => (
          <button key={s} data-testid={`hero-chip-${s.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => go(s)} className="px-2 py-0.5 rounded border border-[#23312A] bg-[#0F1614] hover:border-emerald-500/40 hover:text-emerald-300 transition-colors font-mono">{s}</button>
        ))}
        <span className="ml-auto hidden sm:inline font-mono">Trie · Wagner-Fischer · KMP · Rabin-Karp</span>
      </div>
    </div>
  );
}

function Leader({ label, item, fmt, icon: Icon, decimals = 0 }) {
  if (!item) return null;
  return (
    <Link to={`/players/${fmt}/${item.id}`} data-testid={`leader-${fmt.toLowerCase()}-${label.toLowerCase().replace(/\s+/g, '-')}`} className="group flex items-center gap-3 rounded-md border border-[#1D2823] bg-[#0F1513] px-3 py-2.5 hover:border-emerald-500/40 hover:bg-[#141B18] transition-colors">
      <div className="h-8 w-8 rounded-md border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center shrink-0"><Icon className="h-3.5 w-3.5 text-emerald-400" /></div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
        <div className="text-sm font-semibold truncate group-hover:text-emerald-300 transition-colors">{item.name}</div>
      </div>
      <div className="font-mono font-bold text-emerald-400 tabular">{typeof item.value === 'number' ? (decimals ? fmtDec(item.value, decimals) : fmtInt(item.value)) : item.value}</div>
    </Link>
  );
}

function TopList({ fmt, metric, data }) {
  const key = metric === 'wkt' ? 'wkt' : 'runs';
  const max = data[0]?.[key] || 1;
  return (
    <ul className="divide-y divide-[#1A221E]">
      <AnimatePresence mode="popLayout" initial={false}>
        {data.map((p, i) => (
          <motion.li key={`${metric}-${p.id}`} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03, duration: 0.25 }}>
            <Link data-testid={`top-${fmt.toLowerCase()}-${p.id}`} to={`/players/${fmt}/${p.id}`} className="relative flex items-center gap-3 px-5 py-2.5 hover:bg-[#161E1A] transition-colors group overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(p[key] / max) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }} className="absolute left-0 top-0 bottom-0 bg-emerald-500/[0.05] pointer-events-none" />
              <div className={`w-6 text-xs font-mono ${i < 3 ? 'text-emerald-400 font-bold' : 'text-zinc-500'}`}>{String(i + 1).padStart(2, '0')}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate group-hover:text-emerald-300 transition-colors">{p.name}</div>
                <div className="text-[11px] text-zinc-500 font-mono">{p.mat} mat · {key === 'runs' ? `avg ${fmtDec(p.avg)}` : `bowl avg ${fmtDec(p.bowl_avg)}`} · {p.first}–{p.last}</div>
              </div>
              <div className="text-emerald-400 font-mono font-bold text-sm tabular">{fmtInt(p[key])}</div>
            </Link>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

export default function Dashboard() {
  const [ov, setOv] = useState(null);
  const [top, setTop] = useState({ ODI: { runs: [], wkt: [] }, Test: { runs: [], wkt: [] } });
  const [metric, setMetric] = useState({ ODI: 'runs', Test: 'runs' });
  const [caps, setCaps] = useState({ ODI: [], Test: [] });
  const [names, setNames] = useState([]);

  useEffect(() => {
    fetchOverview().then(setOv).catch(() => {});
    fetchNames('all').then(setNames).catch(() => {});
    Promise.all([fetchTop('ODI', 'runs', 8), fetchTop('ODI', 'wkt', 8), fetchTop('Test', 'runs', 8), fetchTop('Test', 'wkt', 8)])
      .then(([a, b, c, d]) => setTop({ ODI: { runs: a, wkt: b }, Test: { runs: c, wkt: d } })).catch(() => {});
    Promise.all([fetchCaptains('ODI'), fetchCaptains('Test')]).then(([a, b]) => setCaps({ ODI: a.items || [], Test: b.items || [] })).catch(() => {});
  }, []);

  const decades = useMemo(() => {
    if (!ov) return [];
    const map = {};
    ov.odi.debut_decades.forEach(d => { map[d.decade] = { decade: d.decade, ODI: d.debuts, Test: 0 }; });
    ov.test.debut_decades.forEach(d => { map[d.decade] = { ...(map[d.decade] || { decade: d.decade, ODI: 0 }), Test: d.debuts }; });
    return Object.values(map).sort((a, b) => a.decade.localeCompare(b.decade));
  }, [ov]);

  const capOutcome = useMemo(() => ov ? [
    { fmt: 'ODI', Won: ov.odi.captaincy.won, Lost: ov.odi.captaincy.lost, 'Tied': ov.odi.captaincy.tied_or_drawn, 'No Result': ov.odi.captaincy.no_result },
    { fmt: 'Test', Won: ov.test.captaincy.won, Lost: ov.test.captaincy.lost, 'Drawn': ov.test.captaincy.tied_or_drawn },
  ] : [], [ov]);

  const topCaps = useMemo(() => [...caps.ODI.filter(c => c.played >= 20).map(c => ({ ...c, fmt: 'ODI' })), ...caps.Test.filter(c => c.played >= 20).map(c => ({ ...c, fmt: 'Test' }))]
    .sort((a, b) => b.win_pct - a.win_pct).slice(0, 8).map(c => ({ name: `${shortName(c.name)} (${c.fmt})`, win: c.win_pct, played: c.played })), [caps]);

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#23312A]">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-0 scanline pointer-events-none" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(700px circle at 15% 20%, rgba(16,185,129,0.14), transparent 60%), radial-gradient(500px circle at 85% 80%, rgba(163,230,53,0.05), transparent 60%)' }} />
        <div className="marquee-line" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-14 lg:py-20">
          <Stagger>
            <Rise className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-300 text-[11px] uppercase tracking-[0.18em] mb-6">
              <Zap className="h-3 w-3" /> Real data · Hand-written algorithms
            </Rise>
            <Rise>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]" style={{ fontFamily: 'Outfit' }}>
                SPORTS<span className="text-emerald-400 text-glow">PULSE</span>
              </h1>
            </Rise>
            <Rise className="text-xl sm:text-2xl text-zinc-400 font-light mt-3 tracking-wide">
              Sports Performance <span className="text-emerald-400 font-medium">Intelligence</span> for Indian cricket
            </Rise>
            <Rise>
              <p className="text-zinc-500 mt-5 max-w-2xl leading-relaxed">
                A command center over {ov ? fmtInt(ov.total_records) : '…'} real ODI &amp; Test records — every search, comparison and visualization runs on manually implemented string-matching and dynamic-programming algorithms.
              </p>
            </Rise>
            <Rise><HeroSearch names={names} /></Rise>
          </Stagger>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-10">
        {/* KPIs */}
        {!ov ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} h={110} />)}</div> : (
          <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-grid">
            <Kpi testid="stat-odi-players" label="ODI Players" value={ov.odi_players} sub={`Debuts ${ov.odi.first_debut}–${ov.odi.last_debut}`} icon={Users} />
            <Kpi testid="stat-test-players" label="Test Players" value={ov.test_players} sub={`Debuts ${ov.test.first_debut}–${ov.test.last_debut}`} icon={Trophy} />
            <Kpi testid="stat-odi-caps" label="ODI Captains" value={ov.odi_captains} sub={`${fmtInt(ov.odi.captaincy.matches)} matches led · ${ov.odi.captaincy.win_pct}% won`} icon={Crown} />
            <Kpi testid="stat-test-caps" label="Test Captains" value={ov.test_captains} sub={`${fmtInt(ov.test.captaincy.matches)} matches led · ${ov.test.captaincy.win_pct}% won`} icon={Crown} />
            <Kpi testid="stat-odi-runs" label="ODI Runs Aggregate" value={ov.odi_total_runs} sub={`${fmtInt(ov.odi.avg_runs_per_player)} avg per player`} icon={TrendingUp} accent />
            <Kpi testid="stat-odi-wkt" label="ODI Wickets" value={ov.odi_total_wickets} sub={`${ov.odi.hundred_wicket_club} bowlers with 100+`} icon={Target} />
            <Kpi testid="stat-test-runs" label="Test Runs Aggregate" value={ov.test_total_runs} sub={`${ov.test.thousand_run_club} batters with 1000+`} icon={TrendingUp} accent />
            <Kpi testid="stat-test-wkt" label="Test Wickets" value={ov.test_total_wickets} sub={`${ov.test.hundred_wicket_club} bowlers with 100+`} icon={Target} />
          </Stagger>
        )}

        {/* Data integrity strip */}
        {ov && (
          <Rise initial="hidden" animate="show">
            <div className="rounded-lg border border-[#23312A] bg-[#0F1513] px-5 py-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs font-mono text-zinc-400" data-testid="integrity-strip">
              <span className="flex items-center gap-2 text-emerald-300"><Shield className="h-3.5 w-3.5" /> Data integrity</span>
              <span>{fmtInt(ov.total_records)} records from 4 CSV files</span>
              <span>{fmtInt(ov.decoded_cells)} Excel-corrupted cells decoded</span>
              <span>{ov.odi.wicket_keepers + ov.test.wicket_keepers} wicket-keeper records</span>
              <span>{ov.odi.single_match_players + ov.test.single_match_players} one-match careers</span>
              <Link to="/dataset" className="ml-auto text-emerald-400 hover:text-emerald-300 flex items-center gap-1">Explore dataset <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </Rise>
        )}

        {/* Charts */}
        <Stagger className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-6" testid="chart-decades">
            <div className="flex items-center justify-between mb-4">
              <div><Eyebrow>Era distribution</Eyebrow><h3 className="text-xl font-bold mt-1">Debuts per decade · ODI vs Test</h3></div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={decades} margin={{ left: -20, right: 8 }}>
                <defs>
                  <linearGradient id="gOdi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={AC} stopOpacity={0.5} /><stop offset="100%" stopColor={AC} stopOpacity={0} /></linearGradient>
                  <linearGradient id="gTest" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={LIME} stopOpacity={0.35} /><stop offset="100%" stopColor={LIME} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="#23312A" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="decade" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="ODI" stroke={AC} fill="url(#gOdi)" strokeWidth={2} animationDuration={1200} />
                <Area type="monotone" dataKey="Test" stroke={LIME} fill="url(#gTest)" strokeWidth={2} animationDuration={1400} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-6" testid="chart-cap-outcomes">
            <Eyebrow>Captaincy outcomes</Eyebrow><h3 className="text-xl font-bold mt-1 mb-4">All matches led</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={capOutcome} margin={{ left: -20 }}>
                <CartesianGrid stroke="#23312A" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fmt" stroke="#6B7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TIP_STYLE} cursor={{ fill: 'rgba(16,185,129,0.05)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Won" stackId="a" fill={AC} animationDuration={900} />
                <Bar dataKey="Lost" stackId="a" fill={RED} fillOpacity={0.75} animationDuration={900} />
                <Bar dataKey="Tied" stackId="a" fill={AMBER} animationDuration={900} />
                <Bar dataKey="Drawn" stackId="a" fill={BLUE} fillOpacity={0.8} animationDuration={900} />
                <Bar dataKey="No Result" stackId="a" fill="#6B7280" radius={[4, 4, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Stagger>

        {/* Leaders */}
        {ov && (
          <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {['odi', 'test'].map(f => {
              const L = ov[f].leaders; const fmt = f === 'odi' ? 'ODI' : 'Test';
              return (
                <Card key={f} className="p-5" testid={`leaders-${f}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div><Eyebrow>{fmt} record holders</Eyebrow><h3 className="text-lg font-bold mt-0.5">Career leaders</h3></div>
                    <Award className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Leader label="Most runs" item={L.runs} fmt={fmt} icon={TrendingUp} />
                    <Leader label="Most wickets" item={L.wickets} fmt={fmt} icon={Target} />
                    <Leader label="Best average (20+ inns)" item={L.average} fmt={fmt} icon={Sparkles} decimals={2} />
                    <Leader label="Highest score" item={L.highest_score} fmt={fmt} icon={Trophy} />
                    <Leader label="Most matches" item={L.matches} fmt={fmt} icon={Users} />
                    <Leader label="Most catches" item={L.catches} fmt={fmt} icon={Hand} />
                  </div>
                </Card>
              );
            })}
          </Stagger>
        )}

        {/* Top performers + captains */}
        <Stagger className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {['ODI', 'Test'].map(fmt => (
            <Card key={fmt} className="overflow-hidden" testid={`top-${fmt.toLowerCase()}-card`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#23312A]">
                <div><Eyebrow>{fmt}</Eyebrow><div className="font-bold">Top performers</div></div>
                <Seg size="sm" testid={`top-${fmt.toLowerCase()}-metric`} value={metric[fmt]} onChange={v => setMetric(m => ({ ...m, [fmt]: v }))} options={[{ k: 'runs', label: 'Runs' }, { k: 'wkt', label: 'Wickets' }]} />
              </div>
              <TopList fmt={fmt} metric={metric[fmt]} data={top[fmt][metric[fmt]]} />
              <Link to="/players" className="flex items-center justify-center gap-1 py-3 text-xs text-emerald-400 hover:text-emerald-300 border-t border-[#23312A]">All {fmt} players <ArrowRight className="h-3 w-3" /></Link>
            </Card>
          ))}
          <Card className="p-6" testid="chart-top-captains">
            <Eyebrow>Captaincy win % · 20+ matches</Eyebrow><h3 className="text-xl font-bold mt-1 mb-4">Most successful captains</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCaps} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid stroke="#23312A" horizontal={false} />
                <XAxis type="number" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} width={110} />
                <Tooltip contentStyle={TIP_STYLE} formatter={(v, n, p) => [`${v}% · ${p.payload.played} matches`, 'Win rate']} />
                <Bar dataKey="win" fill={AC} radius={[0, 4, 4, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
            <Link to="/captains" className="mt-2 flex items-center justify-end gap-1 text-xs text-emerald-400 hover:text-emerald-300">Captain analytics <ArrowRight className="h-3 w-3" /></Link>
          </Card>
        </Stagger>

        {/* Quick nav */}
        <div>
          <Eyebrow className="mb-3">Explore the platform</Eyebrow>
          <Stagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {NAV.slice(1).map(({ to, label, icon: Icon, hint }) => (
              <Rise key={to}>
                <Link to={to} data-testid={`quick-${label.toLowerCase().replace(/\s+/g, '-')}`} className="group block rounded-lg border border-[#23312A] bg-[#121815] p-4 hover:border-emerald-500/40 hover:-translate-y-0.5 hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.3)] transition-all duration-200">
                  <Icon className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-sm mt-3">{label}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{hint}</div>
                </Link>
              </Rise>
            ))}
          </Stagger>
        </div>

        {/* Algorithm stack */}
        <Rise initial="hidden" animate="show">
          <div className="rounded-lg border border-[#23312A] bg-[#0F1513] p-5 flex flex-col md:flex-row md:items-center gap-4" data-testid="algo-strip">
            <div className="flex items-center gap-3 shrink-0"><Database className="h-5 w-5 text-emerald-400" /><div><div className="font-bold">Algorithmic core</div><div className="text-xs text-zinc-500">7 hand-written algorithms · zero library shortcuts</div></div></div>
            <div className="flex flex-wrap gap-2 md:ml-auto">
              {[['Naive', 'O(nm)'], ['KMP', 'O(n+m)'], ['Z-Function', 'O(n+m)'], ['Rabin-Karp', 'O(n+m)'], ['Trie', 'O(|p|)'], ['Aho-Corasick', 'O(n+z)'], ['Wagner-Fischer', 'O(nm)']].map(([n, c]) => (
                <Link key={n} to="/lab" className="font-mono text-[11px] px-2.5 py-1 rounded border border-[#23312A] bg-[#0B110E] text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-300 transition-colors">{n} <span className="text-zinc-600">{c}</span></Link>
              ))}
            </div>
          </div>
        </Rise>
      </section>
    </div>
  );
}
