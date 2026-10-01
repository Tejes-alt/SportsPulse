// Step-by-step tracers for Algorithm Lab animations. Each returns an array of frames.
// They mirror the hand-written algorithms in algorithms.js exactly (same logic, recorded).
import { computeLPS } from './algorithms';

export function traceNaive(text, pattern) {
  const frames = []; const n = text.length, m = pattern.length; const matches = [];
  if (!m) return { frames, matches };
  for (let i = 0; i <= n - m; i++) {
    let j = 0;
    while (j < m) {
      const eq = text[i + j] === pattern[j];
      frames.push({ i, j, eq, matches: [...matches], note: eq ? `text[${i + j}] = pattern[${j}] ✓` : `mismatch at text[${i + j}] — shift window by 1` });
      if (!eq) break; j++;
    }
    if (j === m) { matches.push(i); frames.push({ i, j: m - 1, eq: true, found: true, matches: [...matches], note: `pattern found at index ${i}` }); }
  }
  return { frames, matches };
}

export function traceKMP(text, pattern) {
  const frames = []; const lps = computeLPS(pattern); const matches = [];
  const n = text.length, m = pattern.length; if (!m) return { frames, lps, matches };
  let i = 0, j = 0;
  while (i < n) {
    const eq = pattern[j] === text[i];
    frames.push({ i, j, eq, matches: [...matches], note: eq ? `text[${i}] = pattern[${j}] ✓ advance both` : j ? `mismatch — jump j from ${j} to lps[${j - 1}] = ${lps[j - 1]} (no backtrack in text)` : `mismatch at j=0 — advance i` });
    if (eq) { i++; j++; }
    if (j === m) { matches.push(i - j); frames.push({ i: i - 1, j: m - 1, eq: true, found: true, matches: [...matches], note: `match at index ${i - j} — j jumps to lps[${m - 1}] = ${lps[m - 1]}` }); j = lps[j - 1]; }
    else if (i < n && pattern[j] !== text[i]) { if (j !== 0) j = lps[j - 1]; else i++; }
  }
  return { frames, lps, matches };
}

export function traceZ(text, pattern) {
  const s = pattern + '\u0000' + text; const n = s.length; const z = new Array(n).fill(0); const frames = [];
  if (!n) return { frames, z, matches: [] };
  z[0] = n; let l = 0, r = 0; const m = pattern.length; const matches = [];
  for (let i = 1; i < n; i++) {
    if (i < r) z[i] = Math.min(r - i, z[i - l]);
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++;
    if (i + z[i] > r) { l = i; r = i + z[i]; }
    const isMatch = i > m && z[i] === m;
    if (isMatch) matches.push(i - m - 1);
    frames.push({ i, l, r, z: [...z], matches: [...matches], note: isMatch ? `z[${i}] = ${m} = |pattern| → match at text index ${i - m - 1}` : `z[${i}] = ${z[i]} · box [${l}, ${r})` });
  }
  return { frames, z, matches };
}

const BASE = 256, MOD = 1000000007;
export function traceRabinKarp(text, pattern) {
  const frames = []; const matches = []; const n = text.length, m = pattern.length;
  if (!m || m > n) return { frames, matches, patternHash: 0 };
  let patternHash = 0, textHash = 0, h = 1;
  for (let i = 0; i < m - 1; i++) h = (h * BASE) % MOD;
  for (let i = 0; i < m; i++) { patternHash = (BASE * patternHash + pattern.charCodeAt(i)) % MOD; textHash = (BASE * textHash + text.charCodeAt(i)) % MOD; }
  for (let i = 0; i <= n - m; i++) {
    const hashEq = patternHash === textHash;
    let verified = false;
    if (hashEq) { verified = true; for (let j = 0; j < m; j++) if (text[i + j] !== pattern[j]) { verified = false; break; } if (verified) matches.push(i); }
    frames.push({ i, textHash, patternHash, hashEq, verified, spurious: hashEq && !verified, matches: [...matches],
      note: verified ? `hash equal → verified char-by-char → match at ${i}` : hashEq ? `hash collision at ${i} (spurious hit) — rejected` : `hash ${textHash} ≠ ${patternHash} → roll window` });
    if (i < n - m) { textHash = (BASE * (textHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % MOD; if (textHash < 0) textHash += MOD; }
  }
  return { frames, matches, patternHash };
}

export function traceEditDistance(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(null));
  const frames = [];
  for (let i = 0; i <= n; i++) { dp[i][0] = i; frames.push({ i, j: 0, v: i, op: 'base', note: `dp[${i}][0] = ${i} (delete ${i} chars)` }); }
  for (let j = 1; j <= m; j++) { dp[0][j] = j; frames.push({ i: 0, j, v: j, op: 'base', note: `dp[0][${j}] = ${j} (insert ${j} chars)` }); }
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    if (a[i - 1] === b[j - 1]) { dp[i][j] = dp[i - 1][j - 1]; frames.push({ i, j, v: dp[i][j], op: 'match', from: [i - 1, j - 1], note: `'${a[i - 1]}' = '${b[j - 1]}' → dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}` }); }
    else {
      const del = dp[i - 1][j], ins = dp[i][j - 1], sub = dp[i - 1][j - 1];
      const mn = Math.min(del, ins, sub);
      const op = mn === sub ? 'substitute' : mn === del ? 'delete' : 'insert';
      const from = op === 'substitute' ? [i - 1, j - 1] : op === 'delete' ? [i - 1, j] : [i, j - 1];
      dp[i][j] = 1 + mn;
      frames.push({ i, j, v: dp[i][j], op, from, note: `'${a[i - 1]}' ≠ '${b[j - 1]}' → 1 + min(del ${del}, ins ${ins}, sub ${sub}) = ${dp[i][j]} (${op})` });
    }
  }
  // backtrack optimal path
  const path = []; const ops = []; let i = n, j = m;
  while (i > 0 || j > 0) {
    path.push([i, j]);
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && dp[i][j] === dp[i - 1][j - 1]) { ops.push({ op: 'keep', ch: a[i - 1] }); i--; j--; }
    else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) { ops.push({ op: 'substitute', from: a[i - 1], to: b[j - 1] }); i--; j--; }
    else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) { ops.push({ op: 'delete', ch: a[i - 1] }); i--; }
    else { ops.push({ op: 'insert', ch: b[j - 1] }); j--; }
  }
  path.push([0, 0]);
  return { frames, dp, distance: dp[n][m], path, ops: ops.reverse() };
}

// Flatten a Trie into positioned nodes for SVG rendering (compact tidy layout).
export function layoutTrie(trie, prefix = '') {
  const nodes = [], edges = []; let leafX = 0;
  const pl = prefix.toLowerCase();
  const walk = (node, depth, ch, parentId, pathStr) => {
    const id = nodes.length; const entry = { id, depth, ch, isEnd: node.isEnd, word: node.word, onPath: pl.startsWith(pathStr) || pathStr.startsWith(pl) && pathStr.length <= pl.length, inSubtree: pathStr.startsWith(pl) && pl.length > 0, x: 0 };
    nodes.push(entry);
    const kids = [...node.children.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    if (!kids.length) { entry.x = leafX++; }
    else {
      const xs = kids.map(([c, child]) => { const cid = walk(child, depth + 1, c, id, pathStr + c); edges.push([id, cid]); return nodes[cid].x; });
      entry.x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    if (parentId !== null) entry.parent = parentId;
    return id;
  };
  walk(trie.root, 0, '', null, '');
  return { nodes, edges, width: leafX, depth: Math.max(...nodes.map(n => n.depth)) };
}
