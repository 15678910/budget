const d2025 = require('../data/processed/regional-by-district-2025.json');
const d2026 = require('../data/processed/regional-by-district-2026.json');

function calcTotal(node) {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((s, c) => s + calcTotal(c), 0);
}

const seoul25 = d2025.children.find(c => c.name === '서울특별시');
const seoul26 = d2026.children.find(c => c.name === '서울특별시');

console.log('=== 서울특별시 자치구별 전년대비 증감률 (백만원 기준) ===\n');

const results = [];
for (const dist26 of seoul26.children) {
  const dist25 = seoul25.children.find(c => c.name === dist26.name);
  const total26 = calcTotal(dist26);
  const total25 = dist25 ? calcTotal(dist25) : 0;
  const yoy = total25 > 0 ? ((total26 - total25) / total25 * 100) : null;
  results.push({ name: dist26.name, t25: total25, t26: total26, yoy });
}

results.sort((a, b) => (b.yoy || 0) - (a.yoy || 0));
for (const r of results) {
  const t25 = (r.t25 / 100).toFixed(0) + '억원';
  const t26 = (r.t26 / 100).toFixed(0) + '억원';
  const yoyStr = r.yoy !== null ? (r.yoy >= 0 ? '+' : '') + r.yoy.toFixed(1) + '%' : 'N/A';
  console.log(`${r.name.padEnd(8)} 2025: ${t25.padStart(10)}  2026: ${t26.padStart(10)}  증감: ${yoyStr}`);
}

// 강서구 상세
console.log('\n=== 강서구 분야별 상세 ===\n');
const gs25 = seoul25.children.find(c => c.name === '강서구');
const gs26 = seoul26.children.find(c => c.name === '강서구');
if (gs25 && gs26) {
  for (const cat26 of gs26.children || []) {
    const cat25 = (gs25.children || []).find(c => c.name === cat26.name);
    const v26 = calcTotal(cat26);
    const v25 = cat25 ? calcTotal(cat25) : 0;
    const change = v25 > 0 ? ((v26 - v25) / v25 * 100) : null;
    const chgStr = change !== null ? (change >= 0 ? '+' : '') + change.toFixed(1) + '%' : 'NEW';
    console.log(`  ${cat26.name.padEnd(14)} 2025: ${(v25/100).toFixed(0).padStart(8)}억  2026: ${(v26/100).toFixed(0).padStart(8)}억  ${chgStr}`);
  }
}
