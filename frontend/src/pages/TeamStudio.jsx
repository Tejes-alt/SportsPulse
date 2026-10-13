import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { UsersRound, Trophy, Shuffle, Plus, X, Download, RefreshCw, Info } from 'lucide-react';
import { api, fetchPlayers } from '../lib/api';
import { Card, PageHeader, Seg } from '../components/kit';

const ROLES = [{key:'batting',label:'Batters'},{key:'bowling',label:'Bowlers'},{key:'allround',label:'All-rounders'},{key:'keeper',label:'Keepers'}];
const initialQuotas = {batting:4,bowling:4,allround:2,keeper:1};
const inputStyle = 'w-full bg-[#0B110E] text-zinc-100 border border-[#23312A] rounded-md px-3 py-2 text-sm outline-none focus:border-emerald-500/60';
const actionStyle = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-emerald-500 text-[#06110B] font-semibold text-sm hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed';
const outlineStyle = 'inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[#23312A] hover:border-emerald-500/40 bg-[#0B110E] text-zinc-300 text-sm';

function Lineup({ result, format, onRemove }) {
  if (!result) return null;
  return <Card className="p-5" hover={false}>
    <div className="flex flex-wrap justify-between items-start gap-3 mb-4"><div><h2 className="font-bold text-lg">Selection results</h2><p className="text-xs text-zinc-500">{result.method === 'optimal' ? 'Exact maximum-score role assignment' : 'Fast greedy heuristic · no optimality guarantee'}</p></div><div className="text-right"><div className="text-2xl font-black text-emerald-400 font-mono">{result.score.toFixed(1)}</div><div className="text-xs text-zinc-500">historical points</div></div></div>
    <div className={`text-sm rounded-md p-3 mb-4 border ${result.feasible ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-300 border-amber-500/30 bg-amber-500/10'}`}>{result.message} ({result.filled}/11 filled)</div>
    <div className="space-y-2">{result.team.map(p=><div key={p.id} className="flex items-center gap-3 rounded-md bg-[#0B110E] border border-[#23312A] p-3"><span className="font-mono text-emerald-400 w-12 text-xs">#{p.id}</span><div className="min-w-0 flex-1"><Link className="text-sm font-semibold hover:text-emerald-400" to={`/players/${format}/${p.id}`}>{p.name}</Link><p className="text-xs text-zinc-500 capitalize">{p.assigned_role} · {p.mat} matches · {p.runs} runs · {p.wkt} wickets</p></div><span className="text-emerald-400 text-sm font-mono">{p.score.toFixed(1)}</span>{onRemove && <button title="Exclude player and recalculate" onClick={()=>onRemove(p.id)} className="text-zinc-500 hover:text-red-400"><X size={16}/></button>}</div>)}</div>
    <p className="text-xs text-zinc-500 mt-4 leading-relaxed">{result.disclaimer}</p>
  </Card>;
}

export default function TeamStudio({mode='builder'}) {
  const [format,setFormat] = useState('ODI');
  const [strategy,setStrategy] = useState('balanced');
  const [method,setMethod] = useState('optimal');
  const [quota,setQuota] = useState(initialQuotas);
  const [minMatches,setMinMatches] = useState(10);
  const [pool,setPool] = useState([]);
  const [query,setQuery] = useState('');
  const [selected,setSelected] = useState([]);
  const [excluded,setExcluded] = useState([]);
  const [result,setResult] = useState(null);
  const [alternatives,setAlternatives] = useState([]);
  const [saved,setSaved] = useState(()=>{try{return JSON.parse(localStorage.getItem("sp-saved-teams")||"[]")}catch{return []}});
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  useEffect(()=>{let alive=true;fetchPlayers({format,limit:2000}).then(d=>{if(alive)setPool(d.items||[])}).catch(e=>{if(alive)setError(e.response?.data?.detail||'Could not load players')});return()=>{alive=false}},[format]);
  useEffect(()=>{setSelected([]);setExcluded([]);setResult(null);setAlternatives([])},[format,mode]);
  const filtered = useMemo(()=>pool.filter(p=>p.name.toLowerCase().includes(query.toLowerCase()) && !selected.includes(p.id)).slice(0,16),[pool,query,selected]);
  const execute = async (chosenMethod=method, extras={}) => {
    setLoading(true);setError('');
    try {const r = await api.post('/teams/build',{format,strategy,method:chosenMethod,quotas:quota,min_matches:minMatches,candidate_ids:mode==='builder'?selected:null,exclude_ids:excluded,...extras});setResult(r.data);return r.data;}
    catch(e){setError(typeof e.response?.data?.detail==='string'?e.response.data.detail:'Unable to generate a lineup. Check the backend connection.');return null;}
    finally{setLoading(false)}
  };
  const compare = async()=>{
    setLoading(true);setError('');
    try {const output=await Promise.all(['balanced','batting','bowling'].map(s=>api.post('/teams/build',{format,strategy:s,method:'optimal',quotas:quota,min_matches:minMatches,candidate_ids:mode==='builder'?selected:null,exclude_ids:excluded})));setAlternatives(output.map((r,i)=>({...r.data,strategy:['balanced','batting','bowling'][i]})));setResult(output[0].data);}
    catch(e){setError(e.response?.data?.detail||'Unable to compare team strategies.')}finally{setLoading(false)}
  };
  const saveTeam=()=>{if(!result)return;const updated=[{id:Date.now(),format,strategy,team:result.team,score:result.score},...saved].slice(0,12);setSaved(updated);try{localStorage.setItem("sp-saved-teams",JSON.stringify(updated))}catch{}};
  const exportTeam=()=>{if(!result)return;const rows=[['Name','Role','Matches','Runs','Wickets','Score'],...result.team.map(p=>[p.name,p.assigned_role,p.mat,p.runs,p.wkt,p.score])];const csv=rows.map(row=>row.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download=`sportspulse-${format.toLowerCase()}-xi.csv`;a.click();URL.revokeObjectURL(url)};
  return <div data-testid="team-studio"><PageHeader eyebrow="Decision intelligence" icon={mode==='builder'?UsersRound:Trophy} title={mode==='builder'?'Smart Team Builder':'Best XI Optimizer'} desc={mode==='builder'?'Choose candidate players, set role requirements and find a valid, high-scoring XI.':'Recommend an XI from the historical dataset using measurable career performance and role constraints.'}/>
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(330px,1fr)] gap-5 items-start">
      <div className="space-y-5">
        <Card className="p-5" hover={false}><div className="font-semibold mb-4">Selection criteria</div><div className="flex flex-wrap gap-3 mb-4"><Seg testid="team-format" options={['ODI','Test']} value={format} onChange={setFormat}/><Seg testid="team-strategy" options={[{k:'balanced',label:'Balanced'},{k:'batting',label:'Batting'},{k:'bowling',label:'Bowling'}]} value={strategy} onChange={setStrategy}/></div>
          <label className="text-xs text-zinc-400">Minimum career matches<input className={`${inputStyle} mt-1 mb-4`} type="number" min="0" max="1000" value={minMatches} onChange={e=>setMinMatches(Math.max(0,Math.min(1000,Number(e.target.value)||0)))}/></label>
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Required role slots · {Object.values(quota).reduce((a,b)=>a+b,0)}/11</div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{ROLES.map(r=><label key={r.key} className="text-xs text-zinc-400">{r.label}<input aria-label={`${r.label} slots`} type="number" min="0" max="11" className={`${inputStyle} mt-1`} value={quota[r.key]} onChange={e=>setQuota(q=>({...q,[r.key]:Math.max(0,Math.min(11,Number(e.target.value)||0))}))}/></label>)}</div>
          <div className="flex gap-3 items-start text-xs text-zinc-500 mt-4"><Info size={16} className="shrink-0 text-emerald-400"/><span>Roles are inferred from runs, wickets and stumpings. They are evidence-based proxies, not officially verified playing positions.</span></div>
        </Card>
        {mode==='builder'&&<Card className="p-5" hover={false}><div className="flex justify-between mb-3 gap-2"><h2 className="font-semibold">Candidate squad</h2><span className="text-xs text-emerald-400 font-mono">{selected.length} selected</span></div><input className={inputStyle} placeholder="Search players to add..." value={query} onChange={e=>setQuery(e.target.value)}/><div className="mt-3 max-h-52 overflow-y-auto divide-y divide-[#23312A]">{filtered.map(p=><button key={p.id} className="w-full flex items-center justify-between py-2 text-left text-sm hover:text-emerald-400" onClick={()=>setSelected(s=>[...s,p.id])}><span>{p.name} <span className="text-xs text-zinc-500">· {p.mat} matches</span></span><Plus size={15}/></button>)}</div><div className="flex flex-wrap gap-2 mt-4">{selected.map(id=>{const p=pool.find(x=>x.id===id);return <button key={id} onClick={()=>setSelected(s=>s.filter(x=>x!==id))} className="flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 px-2 py-1.5 rounded-md">{p?.name||id}<X size={12}/></button>})}</div><p className="text-xs text-zinc-500 mt-3">Add at least 11 eligible players. Larger squads give the optimizer more valid combinations.</p></Card>}
        <Card className="p-5" hover={false}><div className="font-semibold mb-3">Optimization mode</div><Seg testid="team-method" value={method} onChange={setMethod} options={[{k:'optimal',label:'Optimal assignment'},{k:'quick',label:'Quick heuristic'}]}/><p className="text-xs text-zinc-500 mt-3">Optimal uses min-cost max-flow; quick uses a greedy assignment and may be suboptimal or incomplete even when a valid XI exists.</p><div className="flex flex-wrap gap-2 mt-5"><button className={actionStyle} disabled={loading||Object.values(quota).reduce((a,b)=>a+b,0)!==11} onClick={()=>execute()}>{loading?<RefreshCw size={16} className="animate-spin"/>:<Trophy size={16}/>} Generate XI</button><button className={outlineStyle} disabled={loading} onClick={compare}>Compare styles</button>{result&&<button className={outlineStyle} onClick={saveTeam}>Save XI</button>}{result&&<button className={outlineStyle} onClick={exportTeam}><Download size={15}/> Export CSV</button>}</div></Card>
        {error&&<div role="alert" className="border border-red-500/30 bg-red-500/10 text-red-300 rounded-md p-3 text-sm">{error}</div>}
      </div>
      <div className="space-y-5"><Lineup result={result} format={format} onRemove={id=>{setExcluded(e=>[...new Set([...e,id])]);setResult(null)}}/>{!result&&<Card className="p-8 text-center" hover={false}><UsersRound size={40} className="text-emerald-400 mx-auto mb-4"/><h2 className="font-bold">Your XI appears here</h2><p className="text-sm text-zinc-500 mt-2">Set the constraints and generate a historically scored team.</p></Card>}{alternatives.length>0&&<Card className="p-5" hover={false}><h2 className="font-semibold mb-3">Strategy comparisons</h2>{alternatives.map(a=><button key={a.strategy} onClick={()=>{setResult(a);setStrategy(a.strategy)}} className="w-full text-left border-b border-[#23312A] py-3 flex items-center justify-between"><span className="capitalize text-sm">{a.strategy} <span className="text-zinc-500">· {a.filled}/11</span></span><span className="font-mono text-emerald-400">{a.score.toFixed(1)}</span></button>)}<p className="text-xs text-zinc-500 mt-3">Scores vary with strategy weights and should not be compared as if they share an identical objective.</p></Card>}{saved.length>0&&<Card className="p-5" hover={false}><div className="flex items-center justify-between mb-3"><h2 className="font-semibold">Saved teams</h2><span className="text-xs text-zinc-500">Stored in this browser</span></div><div className="space-y-2">{saved.map(s=><div key={s.id} className="border border-[#23312A] p-3 rounded-md flex items-center justify-between gap-2"><button className="text-left text-sm hover:text-emerald-400" onClick={()=>{setFormat(s.format);setStrategy(s.strategy);setResult({team:s.team,score:s.score,filled:s.team.length,feasible:s.team.length===11,method:'saved',disclaimer:'Saved historical lineup. Recalculate to apply updated filters.',message:'Saved XI loaded.'});setAlternatives([])}}>{s.format} · {s.strategy} · {s.team.length} players · {s.score.toFixed(1)}</button><button aria-label="Delete saved XI" title="Delete saved XI" onClick={()=>{const v=saved.filter(x=>x.id!==s.id);setSaved(v);localStorage.setItem('sp-saved-teams',JSON.stringify(v))}}><X size={14}/></button></div>)}</div></Card>}</div>
    </div>
  </div>;
}
