// Manually implemented DSA (ported from TS project).

// ---------------- Naive ----------------
export function naiveSearch(text, pattern) {
  const matches = [];
  let comparisons = 0;
  const n = text.length, m = pattern.length;
  if (!m) return { matches, comparisons };
  for (let i = 0; i <= n - m; i++) {
    let j = 0;
    while (j < m) { comparisons++; if (text[i+j] !== pattern[j]) break; j++; }
    if (j === m) matches.push(i);
  }
  return { matches, comparisons };
}

// ---------------- KMP ----------------
export function computeLPS(pattern) {
  const m = pattern.length;
  const lps = new Array(m).fill(0);
  let len = 0, i = 1;
  while (i < m) {
    if (pattern[i] === pattern[len]) { len++; lps[i] = len; i++; }
    else if (len !== 0) len = lps[len-1];
    else { lps[i] = 0; i++; }
  }
  return lps;
}
export function kmpSearch(text, pattern) {
  const matches = []; const lps = computeLPS(pattern); let comparisons = 0;
  const n = text.length, m = pattern.length;
  if (!m) return { matches, lps: [], comparisons };
  let i = 0, j = 0;
  while (i < n) {
    comparisons++;
    if (pattern[j] === text[i]) { i++; j++; }
    if (j === m) { matches.push(i - j); j = lps[j-1]; }
    else if (i < n && pattern[j] !== text[i]) {
      if (j !== 0) j = lps[j-1]; else i++;
    }
  }
  return { matches, lps, comparisons };
}

// ---------------- Z-Function ----------------
export function zFunction(s) {
  const n = s.length; const z = new Array(n).fill(0);
  if (!n) return z;
  z[0] = n; let l = 0, r = 0;
  for (let i = 1; i < n; i++) {
    if (i < r) z[i] = Math.min(r-i, z[i-l]);
    while (i + z[i] < n && s[z[i]] === s[i+z[i]]) z[i]++;
    if (i + z[i] > r) { l = i; r = i + z[i]; }
  }
  return z;
}
export function zSearch(text, pattern) {
  if (!pattern.length) return { z: [], matches: [] };
  const combined = pattern + '\x00' + text;
  const z = zFunction(combined);
  const matches = [];
  const m = pattern.length;
  for (let i = m+1; i < combined.length; i++) if (z[i] === m) matches.push(i - m - 1);
  return { z, matches };
}

// ---------------- Rabin-Karp ----------------
const BASE = 256, MOD = 1000000007;
export function rabinKarpSearch(text, pattern) {
  const matches = []; const hashComparisons = []; let comparisons = 0;
  const n = text.length, m = pattern.length;
  if (!m || m > n) return { matches, hashComparisons, comparisons };
  let patternHash = 0, textHash = 0, h = 1;
  for (let i = 0; i < m - 1; i++) h = (h * BASE) % MOD;
  for (let i = 0; i < m; i++) {
    patternHash = (BASE * patternHash + pattern.charCodeAt(i)) % MOD;
    textHash = (BASE * textHash + text.charCodeAt(i)) % MOD;
  }
  for (let i = 0; i <= n - m; i++) {
    comparisons++;
    const isMatch = patternHash === textHash;
    if (isMatch) {
      let j = 0, confirmed = true;
      while (j < m) { comparisons++; if (text[i+j] !== pattern[j]) { confirmed = false; break; } j++; }
      if (confirmed) matches.push(i);
      hashComparisons.push({ index: i, textHash, patternHash, match: confirmed });
    } else {
      hashComparisons.push({ index: i, textHash, patternHash, match: false });
    }
    if (i < n - m) {
      textHash = (BASE * (textHash - text.charCodeAt(i) * h) + text.charCodeAt(i+m)) % MOD;
      if (textHash < 0) textHash += MOD;
    }
  }
  return { matches, hashComparisons, comparisons };
}

// ---------------- Trie ----------------
export class Trie {
  constructor() { this.root = { children: new Map(), isEnd: false, word: '' }; }
  insert(word) {
    let node = this.root;
    for (const c of word.toLowerCase()) {
      if (!node.children.has(c)) node.children.set(c, { children: new Map(), isEnd: false, word: '' });
      node = node.children.get(c);
    }
    node.isEnd = true; node.word = word;
  }
  insertMany(words) { for (const w of words) this.insert(w); }
  autocomplete(prefix, limit = 10) {
    let node = this.root;
    for (const c of prefix.toLowerCase()) {
      if (!node.children.has(c)) return [];
      node = node.children.get(c);
    }
    const results = [];
    const dfs = (n) => {
      if (results.length >= limit) return;
      if (n.isEnd) results.push(n.word);
      for (const child of n.children.values()) { if (results.length >= limit) return; dfs(child); }
    };
    dfs(node);
    return results;
  }
  size() {
    let count = 0;
    const dfs = (n) => { if (n.isEnd) count++; for (const c of n.children.values()) dfs(c); };
    dfs(this.root); return count;
  }
}

// ---------------- Aho-Corasick ----------------
export class AhoCorasick {
  constructor(patterns = []) {
    this.root = { children: new Map(), fail: null, output: [] };
    this.patterns = patterns; this.build();
  }
  build() {
    for (const p of this.patterns) {
      let node = this.root;
      for (const c of p.toLowerCase()) {
        if (!node.children.has(c)) node.children.set(c, { children: new Map(), fail: null, output: [] });
        node = node.children.get(c);
      }
      node.output.push(p);
    }
    const q = []; this.root.fail = this.root;
    for (const child of this.root.children.values()) { child.fail = this.root; q.push(child); }
    while (q.length) {
      const node = q.shift();
      for (const [c, child] of node.children) {
        let f = node.fail;
        while (f !== this.root && !f.children.has(c)) f = f.fail;
        if (f.children.has(c) && f.children.get(c) !== child) child.fail = f.children.get(c);
        else child.fail = this.root;
        child.output = [...child.output, ...child.fail.output];
        q.push(child);
      }
    }
  }
  search(text) {
    const res = []; let node = this.root; const t = text.toLowerCase();
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      while (node !== this.root && !node.children.has(c)) node = node.fail;
      if (node.children.has(c)) node = node.children.get(c);
      for (const p of node.output) res.push({ pattern: p, index: i - p.length + 1 });
    }
    return res;
  }
}

// ---------------- Wagner-Fischer (Edit Distance) ----------------
export function wagnerFischer(s1, s2) {
  const n = s1.length, m = s2.length;
  const dp = Array.from({ length: n+1 }, () => new Array(m+1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (s1[i-1] === s2[j-1]) dp[i][j] = dp[i-1][j-1];
      else dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return { distance: dp[n][m], dp };
}
export const editDistance = (a, b) => wagnerFischer(a, b).distance;

// ---------------- Fuzzy Search (uses Wagner-Fischer) ----------------
export function fuzzySearch(query, candidates, limit = 8) {
  const q = query.toLowerCase();
  return candidates
    .map(c => ({ name: c, distance: editDistance(q, c.toLowerCase()) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}
