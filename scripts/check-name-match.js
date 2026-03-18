const geo = require('../data/geo/korea-municipalities-topo.json');
const budget = require('../data/processed/regional-by-district-2026.json');
const objKey = Object.keys(geo.objects)[0];
const geoms = geo.objects[objKey].geometries;

const BTC = {
  '서울특별시': '11', '부산광역시': '21', '대구광역시': '22', '인천광역시': '23',
  '광주광역시': '24', '대전광역시': '25', '울산광역시': '26', '세종특별자치시': '29',
  '경기도': '31', '강원특별자치도': '32', '충청북도': '33', '충청남도': '34',
  '전북특별자치도': '35', '전라남도': '36', '경상북도': '37', '경상남도': '38',
  '제주특별자치도': '39'
};

let totalMatched = 0;
let totalUnmatched = 0;

for (const metro of budget.children) {
  const code = BTC[metro.name];
  if (!code) { console.log('NO CODE:', metro.name); continue; }

  const geoNames = geoms
    .filter(g => g.properties.code && g.properties.code.startsWith(code))
    .map(g => g.properties.name);
  const budgetNames = metro.children
    .filter(c => c.name !== '본청')
    .map(c => c.name);

  const matched = budgetNames.filter(n => geoNames.includes(n));
  const budgetOnly = budgetNames.filter(n => !geoNames.includes(n));
  const geoOnly = geoNames.filter(n => !budgetNames.includes(n));

  totalMatched += matched.length;
  totalUnmatched += budgetOnly.length;

  if (budgetOnly.length > 0 || geoOnly.length > 0) {
    console.log(`${metro.name} (${code}):`);
    if (budgetOnly.length) console.log(`  Budget only: ${budgetOnly.join(', ')}`);
    if (geoOnly.length) console.log(`  Geo only: ${geoOnly.join(', ')}`);
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Matched: ${totalMatched}, Unmatched budget: ${totalUnmatched}`);
