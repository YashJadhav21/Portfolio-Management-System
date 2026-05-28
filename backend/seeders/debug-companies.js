const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function str(v) { return (v === null || v === undefined) ? '' : String(v).trim(); }

const ROOT = path.resolve(__dirname, '..', '..');

// Test BSE xlsx
try {
  const wb = XLSX.readFile(path.join(ROOT, 'List of Scrips traded on BSE.xlsx'));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
  let count = 0;
  for (const row of rows.slice(1)) {
    const isin = str(row[7]);
    const name = str(row[3]) || str(row[1]);
    const code = str(row[0]);
    if (!name) continue;
    count++;
  }
  console.log('Valid BSE rows:', count);
  console.log('BSE sample row[1]:', JSON.stringify(rows[1]));
} catch (e) {
  console.error('BSE error:', e.message);
}

// Test Equity.csv using XLSX (treat as CSV)
try {
  const wb2 = XLSX.readFile(path.join(ROOT, 'Equity.csv'));
  const ws2 = wb2.Sheets[wb2.SheetNames[0]];
  const rows2 = XLSX.utils.sheet_to_json(ws2, { header: 1, defval: '', raw: true });
  let count2 = 0;
  for (const row of rows2.slice(1)) {
    const name = str(row[3]) || str(row[1]);
    if (!name) continue;
    count2++;
  }
  console.log('Valid Equity.csv rows (via XLSX):', count2);
} catch (e) {
  console.error('Equity CSV error:', e.message);
}
