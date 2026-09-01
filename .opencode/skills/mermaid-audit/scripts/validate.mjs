import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
global.Node = dom.window.Node;

const mermaid = (await import('mermaid')).default;
mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

const repo = process.argv[2] || '.';
const reMermaid = /```mermaid\n([\s\S]*?)```/g;

let blocks = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === '.opencode' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.md')) {
      const t = fs.readFileSync(p, 'utf8');
      let m;
      while ((m = reMermaid.exec(t))) {
        const before = t.slice(0, m.index).split('\n').length;
        blocks.push({ file: path.relative(repo, p), line: before, code: m[1] });
      }
    }
  }
}
walk(repo);

console.log(`共发现 mermaid 块: ${blocks.length}`);
let errors = [];
for (const b of blocks) {
  try {
    await mermaid.parse(b.code);
  } catch (e) {
    errors.push({ file: b.file, line: b.line, msg: String(e && e.message ? e.message : e) });
  }
}
if (errors.length === 0) {
  console.log('✅ 全部 mermaid 块解析通过');
  process.exit(0);
} else {
  console.log(`❌ 解析失败 ${errors.length} 个:`);
  for (const e of errors) {
    console.log(`\n[${e.file}:${e.line}]`);
    console.log(e.msg.split('\n').slice(0, 6).join('\n'));
  }
  process.exit(1);
}
