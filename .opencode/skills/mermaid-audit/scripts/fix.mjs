// mermaid 图布局审计与修复脚本
// 1) 顶层 LR/RL 且含真实兄弟(分叉/汇合) -> TB
// 2) 子图 direction LR/RL 且内部含真实兄弟 -> TB
// 纯链/循环(无兄弟)保持 LR；循环回边不算兄弟。
//
// 依赖: 同目录 npm install mermaid jsdom
// 用法: node fix.mjs <repo根目录>

import fs from 'fs';
import path from 'path';

const repo = process.argv[2] || '.';
const KW = ['subgraph', 'end', 'classDef', 'class', 'click', 'style', 'linkStyle', 'direction'];

function extract(text) {
  const subRe = /subgraph\s+([A-Za-z_][A-Za-z0-9_]*)/g;
  const subs = new Set(); let s;
  while ((s = subRe.exec(text))) subs.add(s[1]);
  const edgeRe = /([A-Za-z_][A-Za-z0-9_]*)\s*(?:\[[^\]]*\]|\{[^}]*\}|\(\([^)]*\)\)|\([^)]*\))?\s*(?:-->|-\.->|==>|<->|<\.->|--|===|---)\s*(?:\|[^\n|]*\||\|"[^"]*"\|)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*(?:\[[^\]]*\]|\{[^}]*\}|\(\([^)]*\)\)|\([^)]*\))?/g;
  const nodes = new Set(); const edges = [];
  let mm;
  while ((mm = edgeRe.exec(text))) {
    let a = mm[1], b = mm[2];
    if (KW.includes(a) || KW.includes(b)) continue;
    if (subs.has(a) || subs.has(b)) continue;
    if (a === b) continue;
    edges.push([a, b]); nodes.add(a); nodes.add(b);
  }
  return { nodes: [...nodes], edges };
}

function hasRealSiblings(nodes, edges) {
  const indeg = {}, outdeg = {};
  for (const n of nodes) { indeg[n] = 0; outdeg[n] = 0; }
  for (const [a, b] of edges) { outdeg[a]++; indeg[b]++; }
  const adj = {}; for (const n of nodes) adj[n] = [];
  for (const [a, b] of edges) adj[a].push(b);
  function reach(u, t) {
    const seen = new Set([u]); const st = [u];
    while (st.length) { const x = st.pop(); for (const v of adj[x]) { if (v === t) return true; if (!seen.has(v)) { seen.add(v); st.push(v); } } }
    return false;
  }
  // 两父/两子互相不可达 且 非回边 => 真实兄弟(分叉/汇合)
  const incomp = (x, y, z) => !reach(x, y) && !reach(y, x) && !reach(x, z) && !reach(y, z);
  for (const n of nodes) {
    if (outdeg[n] >= 2) { const ch = edges.filter(e => e[0] === n).map(e => e[1]); for (let i = 0; i < ch.length; i++) for (let j = i + 1; j < ch.length; j++) if (incomp(ch[i], ch[j], n)) return true; }
    if (indeg[n] >= 2) { const pars = edges.filter(e => e[1] === n).map(e => e[0]); for (let i = 0; i < pars.length; i++) for (let j = i + 1; j < pars.length; j++) if (incomp(pars[i], pars[j], n)) return true; }
  }
  return false;
}

function processBlock(body) {
  let changed = false;
  const lines = body.split('\n');
  // 顶层方向
  const head = body.match(/^(flowchart|graph)\s+(TB|TD|BT|LR|RL)/m);
  if (head) {
    const dir = head[2];
    if ((dir === 'LR' || dir === 'RL')) {
      const { nodes, edges } = extract(body);
      if (hasRealSiblings(nodes, edges)) {
        body = body.replace(/^(flowchart|graph)\s+(LR|RL)/m, '$1 TB');
        changed = true;
      }
    }
  }
  // 子图方向
  const stack = []; const subs = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const sg = l.match(/^\s*subgraph\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (sg) { stack.push({ id: sg[1], start: i, end: -1, dir: null, dirAt: -1 }); }
    else if (/^\s*end\s*$/.test(l)) { if (stack.length) { const s = stack.pop(); s.end = i; subs.push(s); } }
    const dm = l.match(/^\s*direction\s+(LR|RL|TB|TD|BT)\s*$/);
    if (dm && stack.length) { stack[stack.length - 1].dir = dm[1]; stack[stack.length - 1].dirAt = i; }
  }
  for (const s of subs) {
    if (s.dir !== 'LR' && s.dir !== 'RL') continue;
    const out = [];
    for (let i = s.start + 1; i < s.end; i++) {
      let nest = false;
      for (const o of subs) if (o !== s && i > o.start && i < o.end) { nest = true; break; }
      if (!nest) out.push(lines[i]);
    }
    const txt = out.join('\n');
    const { nodes, edges } = extract(txt);
    let sib = hasRealSiblings(nodes, edges);
    if (!sib && txt.match(/[A-Za-z_][A-Za-z0-9_]*\s*&\s*[A-Za-z_][A-Za-z0-9_]*/)) sib = true;
    if (sib) {
      lines[s.dirAt] = lines[s.dirAt].replace(/direction\s+(LR|RL)/, 'direction TB');
      changed = true;
    }
  }
  return changed ? lines.join('\n') : body;
}

function walk(dir, cb) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === '.opencode' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, cb);
    else if (e.name.endsWith('.md')) cb(p);
  }
}
let changedFiles = [];
walk(repo, (f) => {
  let t = fs.readFileSync(f, 'utf8');
  let n = t.replace(/```mermaid\n([\s\S]*?)```/g, (full, body) => {
    const nb = processBlock(body);
    return nb === body ? full : '```mermaid\n' + nb + '```';
  });
  if (n !== t) { fs.writeFileSync(f, n); changedFiles.push(path.relative(repo, f)); }
});
console.log(`修改文件数: ${changedFiles.length}`);
for (const f of changedFiles) console.log('  ' + f);
