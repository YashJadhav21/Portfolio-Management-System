/**
 * fix-and-reseed-companies.js
 * Drops the stale 'symbol_1' unique index on companies collection,
 * then seeds all companies/banks from BSE.xlsx and known banks.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const Company = require('../models/Company.model');

const ROOT = path.resolve(__dirname, '..', '..');
const BSE_FILE = path.join(ROOT, 'List of Scrips traded on BSE.xlsx');

function str(v) { return (v === null || v === undefined) ? '' : String(v).trim(); }

const BANK_KEYWORDS = [
  'bank', 'financial', 'finance', 'housing finance', 'cooperative',
  'co-operative', 'credit', 'gramin bank', 'mahila bank', 'nidhi',
];
function isBank(name) {
  if (!name) return false;
  return BANK_KEYWORDS.some(kw => name.toLowerCase().includes(kw));
}

// Large set of known major Indian banks with real ISINs
const KNOWN_BANKS = [
  { code: 'SBI',     name: 'State Bank of India',           flag: 'B', isin: 'INE062A01020', sector: 'Banking' },
  { code: 'HDFCB',   name: 'HDFC Bank Limited',             flag: 'B', isin: 'INE040A01034', sector: 'Banking' },
  { code: 'ICICIB',  name: 'ICICI Bank Limited',            flag: 'B', isin: 'INE090A01021', sector: 'Banking' },
  { code: 'AXISB',   name: 'Axis Bank Limited',             flag: 'B', isin: 'INE238A01034', sector: 'Banking' },
  { code: 'KOTAKB',  name: 'Kotak Mahindra Bank Limited',   flag: 'B', isin: 'INE237A01028', sector: 'Banking' },
  { code: 'BOB',     name: 'Bank of Baroda',                flag: 'B', isin: 'INE028A01039', sector: 'Banking' },
  { code: 'PNB',     name: 'Punjab National Bank',          flag: 'B', isin: 'INE160A01022', sector: 'Banking' },
  { code: 'CANARA',  name: 'Canara Bank',                   flag: 'B', isin: 'INE476A01022', sector: 'Banking' },
  { code: 'UNION',   name: 'Union Bank of India',           flag: 'B', isin: 'INE692A01016', sector: 'Banking' },
  { code: 'BOI',     name: 'Bank of India',                 flag: 'B', isin: 'INE084A01016', sector: 'Banking' },
  { code: 'IDBI',    name: 'IDBI Bank Limited',             flag: 'B', isin: 'INE008A01015', sector: 'Banking' },
  { code: 'YES',     name: 'Yes Bank Limited',              flag: 'B', isin: 'INE528G01035', sector: 'Banking' },
  { code: 'INDUS',   name: 'IndusInd Bank Limited',         flag: 'B', isin: 'INE095A01012', sector: 'Banking' },
  { code: 'FEDERAL', name: 'Federal Bank Limited',          flag: 'B', isin: 'INE171A01029', sector: 'Banking' },
  { code: 'IOB',     name: 'Indian Overseas Bank',          flag: 'B', isin: 'INE565A01014', sector: 'Banking' },
  { code: 'CBI',     name: 'Central Bank of India',         flag: 'B', isin: 'INE483A01010', sector: 'Banking' },
  { code: 'SOUTH',   name: 'South Indian Bank Limited',     flag: 'B', isin: 'INE683A01023', sector: 'Banking' },
  { code: 'IDFC',    name: 'IDFC FIRST Bank Limited',       flag: 'B', isin: 'INE092T01019', sector: 'Banking' },
  { code: 'RBL',     name: 'RBL Bank Limited',              flag: 'B', isin: 'INE976G01028', sector: 'Banking' },
  { code: 'BANDHAN', name: 'Bandhan Bank Limited',          flag: 'B', isin: 'INE545U01014', sector: 'Banking' },
  { code: 'UCO',     name: 'UCO Bank',                      flag: 'B', isin: 'INE691A01018', sector: 'Banking' },
  { code: 'INDIAN',  name: 'Indian Bank',                   flag: 'B', isin: 'INE562A01011', sector: 'Banking' },
  { code: 'MAHAB',   name: 'Bank of Maharashtra',           flag: 'B', isin: 'INE457A01014', sector: 'Banking' },
  { code: 'PSB',     name: 'Punjab & Sind Bank',            flag: 'B', isin: 'INE608A01012', sector: 'Banking' },
  { code: 'KARNB',   name: 'Karnataka Bank Limited',        flag: 'B', isin: 'INE614B01018', sector: 'Banking' },
  { code: 'DCBB',    name: 'DCB Bank Limited',              flag: 'B', isin: 'INE503A01015', sector: 'Banking' },
  { code: 'CITYUN',  name: 'City Union Bank Limited',       flag: 'B', isin: 'INE491A01021', sector: 'Banking' },
  { code: 'TAMILNAD',name: 'Tamilnad Mercantile Bank Ltd',  flag: 'B', isin: 'INE819C01020', sector: 'Banking' },
  { code: 'LAKSHMI', name: 'Lakshmi Vilas Bank Limited',    flag: 'B', isin: 'INE694C01018', sector: 'Banking' },
  { code: 'NAINITAL',name: 'Nainital Bank Limited',         flag: 'B', isin: '',             sector: 'Banking' },
  { code: 'POSTOFF', name: 'India Post Payments Bank',      flag: 'B', isin: '',             sector: 'Post Office' },
  { code: 'INDPOST', name: 'Indian Postal Service (Post Office Savings)', flag: 'B', isin: '', sector: 'Post Office' },
];

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio_management';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  // Step 1: Drop the stale 'symbol_1' unique index
  try {
    await mongoose.connection.collection('companies').dropIndex('symbol_1');
    console.log('✓ Dropped stale symbol_1 unique index');
  } catch (e) {
    console.log('symbol_1 index not found or already dropped:', e.message);
  }

  // Step 2: Clear companies
  await Company.deleteMany({});
  console.log('✓ Cleared companies collection');

  // Step 3: Read BSE.xlsx
  const companyMap = new Map(); // isin/key → doc

  if (fs.existsSync(BSE_FILE)) {
    const wb = XLSX.readFile(BSE_FILE);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
    for (const row of rows.slice(1)) {
      // Columns: [Security Code, Issuer Name, Security Id, Security Name, Status, Group, Face Value, ISIN No, Instrument]
      const code   = str(row[0]);
      const name   = str(row[3]) || str(row[1]);
      const status = str(row[4]);
      const isin   = str(row[7]);
      const instr  = str(row[8]);

      if (!name) continue;
      if (status && status.toLowerCase() === 'suspended') continue; // skip suspended

      const flag = isBank(name) ? 'B' : 'C';
      const sector = instr || 'Equity';
      const key = isin || `BSE-${code}`;

      if (!companyMap.has(key)) {
        companyMap.set(key, { code, name, flag, isin, sector });
      }
    }
    console.log(`✓ Read ${companyMap.size} records from BSE.xlsx`);
  } else {
    console.warn('BSE.xlsx not found — skipping');
  }

  // Step 4: Add known banks (don't overwrite existing by ISIN)
  for (const b of KNOWN_BANKS) {
    const key = b.isin || `BANK-${b.code}`;
    if (!companyMap.has(key)) {
      companyMap.set(key, b);
    } else {
      // Ensure it is flagged as bank
      companyMap.get(key).flag = 'B';
    }
  }

  // Step 5: Also forcefully flag companies whose name contains bank keywords
  for (const [key, doc] of companyMap) {
    if (isBank(doc.name)) doc.flag = 'B';
  }

  // Step 6: Insert all
  const docs = Array.from(companyMap.values()).filter(c => c.name && c.name.length > 1);
  
  // Insert in batches of 200 to avoid overwhelming MongoDB
  const BATCH = 200;
  let inserted = 0;
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH);
    try {
      await Company.insertMany(batch, { ordered: false });
      inserted += batch.length;
    } catch (e) {
      // Count partial inserts
      if (e.insertedDocs) inserted += e.insertedDocs.length;
      else inserted += batch.length; // best estimate
    }
  }

  const finalCount = await Company.countDocuments();
  console.log(`✓ Seeded ${finalCount} companies/banks in DB`);
  
  // Summary breakdown
  const banks = await Company.countDocuments({ flag: 'B' });
  const comps = await Company.countDocuments({ flag: 'C' });
  console.log(`   Banks: ${banks} | Companies: ${comps}`);

  await mongoose.disconnect();
  console.log('✅ Done!');
}

run().catch(e => { console.error(e); process.exit(1); });
