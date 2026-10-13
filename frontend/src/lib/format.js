export const fmtInt = (v) => (v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toLocaleString());
export const fmtDec = (v, d = 2) => (v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toFixed(d));
export const fmtStr = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));
export const fmtPct = (v) => (v === null || v === undefined ? '—' : `${Number(v).toFixed(v % 1 === 0 ? 0 : 2)}%`);
export const span = (p) => (p?.first && p?.last ? (p.first === p.last ? p.first : `${p.first}–${p.last}`) : '—');
export const safeDiv = (a, b, d = 2) => (b ? +(a / b).toFixed(d) : null);
export const shortName = (n = '') => { const parts = n.replace(/\./g, '. ').trim().split(/\s+/); return parts.length > 1 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : n; };
export const initials = (n = '') => n.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
export const TIP_STYLE = { background: '#0B110E', border: '1px solid #23312A', borderRadius: 8, fontSize: 12, boxShadow: '0 12px 40px -10px rgba(0,0,0,.7)' };
