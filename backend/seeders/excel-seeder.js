/**
 * excel-seeder.js
 * ───────────────────────────────────────────────────────────────────────────
 * Reads all source Excel / CSV files and seeds MongoDB with:
 *   - Admin user
 *   - 8 family groups + 22 investors
 *   - 4 fixed categories + all subcategories from screenshot
 *   - Company/Bank Master  (from Equity.csv + BSE.xlsx + NSE.xlsx)
 *     flag='C' for companies, flag='B' for known banks
 *   - AMC Master           (from MF Excel — code = numeric AMFI code, name = AMC full name)
 *   - Scheme Master        (from MF Excel — schemeCode=numeric code, name, ISIN, mfType from category)
 *
 * Usage (from backend/ directory):
 *   npm run seed
 * ───────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();

const fs   = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const XLSX = require('xlsx');

// ── Models ──────────────────────────────────────────────────────────────────
const User        = require('../models/User.model');
const Group       = require('../models/Group.model');
const Investor    = require('../models/Investor.model');
const Category    = require('../models/Category.model');
const Subcategory = require('../models/Subcategory.model');
const Company     = require('../models/Company.model');
const AMC         = require('../models/AMC.model');
const Scheme      = require('../models/Scheme.model');
const FixedDeposit= require('../models/FixedDeposit.model');
const MutualFund  = require('../models/MutualFund.model');
const Share       = require('../models/Share.model');

// Optionally clear Bank too if it exists
let Bank;
try { Bank = require('../models/Bank.model'); } catch (_) { Bank = null; }

const { SAMPLE_GROUPS, SAMPLE_INVESTORS } = require('./seed-data');

// ── File paths ───────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..', '..');
const FILES = {
  equity:  path.join(ROOT, 'Equity.csv'),
  bse:     path.join(ROOT, 'List of Scrips traded on BSE.xlsx'),
  nse:     path.join(ROOT, 'List of Scrips traded on NSE.xlsx'),
  mf:      path.join(ROOT, 'List of Mutual Funds AMC wise & Scheme-wise (1).xlsx'),
};

// ── Admin account ────────────────────────────────────────────────────────────
const ADMIN = {
  username: process.env.SEED_ADMIN_USERNAME || 'admin',
  email:    process.env.SEED_ADMIN_EMAIL    || 'admin@pms.com',
  password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
};

// ── Fixed Categories + Subcategories (from screenshot) ──────────────────────
const FIXED_CATEGORIES = [
  {
    code: 'FI',
    name: 'Fixed Income Securities',
    subcategories: [
      { code: 'BNFD',  name: 'BNFD' },
      { code: 'CNFD',  name: 'CNFD' },
      { code: 'BCFD',  name: 'BCFD' },
      { code: 'CCFD',  name: 'CCFD' },
      { code: 'CD',    name: 'CD'   },
      { code: 'NCD',   name: 'NCD'  },
      { code: 'PMIS',  name: 'PMIS' },
      { code: 'PTD',   name: 'PTD'  },
      { code: 'INSA',  name: 'Insurance Annuity' },
    ],
  },
  {
    code: 'MF',
    name: 'Mutual Funds',
    subcategories: [
      { code: 'DIV', name: 'Dividend' },
      { code: 'GRW', name: 'Growth'   },
    ],
  },
  {
    code: 'SH',
    name: 'Shares',
    subcategories: [
      { code: 'COB', name: 'Co-operative Bank' },
      { code: 'PRF', name: 'Preference'        },
      { code: 'EQT', name: 'Equity'            },
    ],
  },
  {
    code: 'INS',
    name: 'Insurance',
    subcategories: [
      { code: 'END', name: 'Endowment'           },
      { code: 'ULP', name: 'ULIP'                },
      { code: 'TRM', name: 'Term Insurance'      },
      { code: 'RET', name: 'Retirement / Pension' },
    ],
  },
];

// ── Known banks to flag with 'B' ─────────────────────────────────────────────
const BANK_KEYWORDS = [
  'bank', 'financial', 'finance', 'housing finance', 'cooperative',
  'co-operative', 'credit', 'gramin bank', 'mahila bank', 'nidhi',
];

function isBank(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return BANK_KEYWORDS.some(kw => lower.includes(kw));
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function str(v) { return (v === null || v === undefined) ? '' : String(v).trim(); }
function num(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && isFinite(v)) return v;
  const n = Number(String(v).replace(/[^0-9.-]/g, ''));
  return isFinite(n) ? n : null;
}

function readXlsx(filePath, sheetIndex = 0) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[sheetIndex]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    // Simple CSV split (fields don't contain commas within quotes in this file)
    return line.split(',').map(f => f.trim().replace(/^"(.*)"$/, '$1'));
  });
}

// Map "Equity Scheme - Large & Mid Cap Fund" → "Large Cap" / "Mid Cap" / "Flexi Cap"
function inferMfType(schemeCategory) {
  const cat = str(schemeCategory).toLowerCase();
  if (cat.includes('large cap'))        return 'Large Cap';
  if (cat.includes('mid cap'))          return 'Mid Cap';
  if (cat.includes('flexi cap'))        return 'Flexi Cap';
  if (cat.includes('large & mid cap'))  return 'Large Cap';
  if (cat.includes('large and mid cap'))return 'Large Cap';
  if (cat.includes('multi cap'))        return 'Flexi Cap';
  if (cat.includes('small cap'))        return 'Mid Cap';
  return '';
}

// D/G flag from NAV name
function inferDgFlag(navName) {
  const n = str(navName).toLowerCase();
  if (n.includes('idcw') || n.includes('dividend')) return 'Dividend';
  if (n.includes('growth'))                          return 'Growth';
  return '';
}

// ── Clear collections ─────────────────────────────────────────────────────────
async function clearAll() {
  const models = [User, Group, Investor, Category, Subcategory, Company, AMC, Scheme, FixedDeposit, MutualFund, Share];
  if (Bank) models.push(Bank);
  await Promise.all(models.map(m => m.deleteMany({})));
  console.log('✓ Cleared all collections');
}

// ── 1. Admin user ─────────────────────────────────────────────────────────────
async function seedAdmin() {
  const user = await User.create({ ...ADMIN, role: 'admin' });
  console.log(`✓ Admin user: ${user.username} / ${ADMIN.password}`);
  return user;
}

// ── 2. Categories + Subcategories (fixed from screenshot) ────────────────────
async function seedCategories() {
  for (const cat of FIXED_CATEGORIES) {
    const catDoc = await Category.create({ code: cat.code, name: cat.name });
    if (cat.subcategories && cat.subcategories.length) {
      await Subcategory.insertMany(
        cat.subcategories.map(s => ({ categoryId: catDoc._id, code: s.code, name: s.name }))
      );
    }
  }
  console.log(`✓ Seeded ${FIXED_CATEGORIES.length} categories + subcategories`);
}

// ── 3. Groups + Investors ─────────────────────────────────────────────────────
async function seedGroupsAndInvestors() {
  const groups = await Group.insertMany(SAMPLE_GROUPS, { ordered: true });
  const groupMap = new Map(groups.map(g => [g.name, g._id]));

  const investorDocs = SAMPLE_INVESTORS.map(inv => ({
    name:    inv.name,
    email:   inv.email,
    mobile:  inv.mobile,
    pan:     inv.pan,
    address: inv.address,
    groupId: groupMap.get(inv.groupName) || null,
    status:  'Active',
  }));

  const investors = await Investor.insertMany(investorDocs, { ordered: true });
  console.log(`✓ Seeded ${groups.length} groups + ${investors.length} investors`);
  return { groups, investors };
}

// ── 4. Company / Bank Master ──────────────────────────────────────────────────
// Source priority: Equity.csv (BSE), then BSE.xlsx (BSE), then NSE.xlsx (NSE)
// Key = ISIN (most reliable unique ID), fallback to Security Code or symbol
async function seedCompanies() {
  const companyMap = new Map(); // isin → doc

  // --- Equity.csv (BSE) ---
  const equityRows = readCsv(FILES.equity).slice(1);
  for (const row of equityRows) {
    const isin = str(row[7]);
    const name = str(row[3]) || str(row[1]);
    const code = str(row[0]);
    const flag = isBank(name) ? 'B' : 'C';
    const sector = str(row[8]) || '';
    if (!name) continue;
    const key = isin || `BSE-${code}`;
    if (!companyMap.has(key)) {
      companyMap.set(key, { code, name, flag, isin, sector });
    }
  }

  // --- BSE.xlsx ---
  try {
    const bseRows = readXlsx(FILES.bse).slice(1);
    for (const row of bseRows) {
      const isin = str(row[7]);
      const name = str(row[3]) || str(row[1]);
      const code = str(row[0]);
      const flag = isBank(name) ? 'B' : 'C';
      const sector = '';
      if (!name) continue;
      const key = isin || `BSE-${code}`;
      if (!companyMap.has(key)) {
        companyMap.set(key, { code, name, flag, isin, sector });
      }
    }
  } catch (e) { console.warn('BSE.xlsx skipped:', e.message); }

  // --- NSE.xlsx ---
  try {
    const nseRows = readXlsx(FILES.nse).slice(1);
    for (const row of nseRows) {
      const symbol = str(row[0]);
      const name   = str(row[1]);
      const isin   = str(row[6]);
      const flag   = isBank(name) ? 'B' : 'C';
      if (!name) continue;
      const key = isin || `NSE-${symbol}`;
      if (!companyMap.has(key)) {
        companyMap.set(key, { code: symbol, name, flag, isin, sector: '' });
      } else {
        // Merge: prefer longer name
        const ex = companyMap.get(key);
        if (name.length > (ex.name || '').length) ex.name = name;
        if (!ex.code && symbol) ex.code = symbol;
        if (!ex.isin && isin)   ex.isin = isin;
      }
    }
  } catch (e) { console.warn('NSE.xlsx skipped:', e.message); }

  // Also seed key banks that are typically used in FD transactions
  const KNOWN_BANKS = [
    { code: 'SBI',    name: 'State Bank of India',                 flag: 'B', isin: '', sector: 'Banking' },
    { code: 'HDFC',   name: 'HDFC Bank Limited',                   flag: 'B', isin: 'INE040A01034', sector: 'Banking' },
    { code: 'ICICI',  name: 'ICICI Bank Limited',                  flag: 'B', isin: 'INE090A01021', sector: 'Banking' },
    { code: 'AXIS',   name: 'Axis Bank Limited',                   flag: 'B', isin: 'INE238A01034', sector: 'Banking' },
    { code: 'KOTAK',  name: 'Kotak Mahindra Bank Limited',         flag: 'B', isin: 'INE237A01028', sector: 'Banking' },
    { code: 'BOB',    name: 'Bank of Baroda',                      flag: 'B', isin: 'INE028A01039', sector: 'Banking' },
    { code: 'PNB',    name: 'Punjab National Bank',                flag: 'B', isin: 'INE160A01022', sector: 'Banking' },
    { code: 'CANARA', name: 'Canara Bank',                        flag: 'B', isin: 'INE476A01022', sector: 'Banking' },
    { code: 'UNION',  name: 'Union Bank of India',                 flag: 'B', isin: 'INE692A01016', sector: 'Banking' },
    { code: 'BOI',    name: 'Bank of India',                       flag: 'B', isin: 'INE084A01016', sector: 'Banking' },
    { code: 'IDBI',   name: 'IDBI Bank Limited',                   flag: 'B', isin: 'INE008A01015', sector: 'Banking' },
    { code: 'YES',    name: 'Yes Bank Limited',                    flag: 'B', isin: 'INE528G01035', sector: 'Banking' },
    { code: 'INDUS',  name: 'IndusInd Bank Limited',               flag: 'B', isin: 'INE095A01012', sector: 'Banking' },
    { code: 'FEDERAL',name: 'Federal Bank Limited',                flag: 'B', isin: 'INE171A01029', sector: 'Banking' },
    { code: 'IOB',    name: 'Indian Overseas Bank',                flag: 'B', isin: 'INE565A01014', sector: 'Banking' },
    { code: 'CBI',    name: 'Central Bank of India',               flag: 'B', isin: 'INE483A01010', sector: 'Banking' },
    { code: 'SOUTH',  name: 'South Indian Bank Limited',           flag: 'B', isin: 'INE683A01023', sector: 'Banking' },
    { code: 'IDFC',   name: 'IDFC FIRST Bank Limited',             flag: 'B', isin: 'INE092T01019', sector: 'Banking' },
    { code: 'RBL',    name: 'RBL Bank Limited',                    flag: 'B', isin: 'INE976G01028', sector: 'Banking' },
    { code: 'BANDHAN',name: 'Bandhan Bank Limited',                flag: 'B', isin: 'INE545U01014', sector: 'Banking' },
  ];

  for (const b of KNOWN_BANKS) {
    const key = b.isin || `BANK-${b.code}`;
    if (!companyMap.has(key)) companyMap.set(key, b);
  }

  const companies = Array.from(companyMap.values()).filter(c => c.name);
  await Company.insertMany(companies, { ordered: false }).catch(() => {});
  console.log(`✓ Seeded ${companies.length} companies/banks`);
  return companies.length;
}

// ── 5. AMC Master + Scheme Master ────────────────────────────────────────────
// AMC code = first 4 chars of AMC name (uppercased) padded — unique
// Scheme code = numeric code from MF Excel column 1
// mfType inferred from scheme category
async function seedAmcsAndSchemes() {
  const rows = readXlsx(FILES.mf).slice(1); // skip header

  // Build unique AMC list: name → earliest code seen
  const amcCodeMap = new Map(); // amcName → amcCode (string)
  for (const row of rows) {
    const amcName = str(row[0]);
    const code    = str(row[1]); // numeric scheme code — NOT amc code
    if (!amcName) continue;
    if (!amcCodeMap.has(amcName)) {
      // Generate a readable AMC short code from the name
      const words   = amcName.replace(/[^a-zA-Z ]/g, ' ').split(/\s+/).filter(Boolean);
      let shortCode = words.slice(0, 4).map(w => w[0].toUpperCase()).join('');
      // Ensure uniqueness
      let candidate = shortCode;
      let suffix    = 2;
      while ([...amcCodeMap.values()].includes(candidate)) {
        candidate = shortCode + suffix++;
      }
      amcCodeMap.set(amcName, candidate);
    }
  }

  // Insert AMCs
  const amcDocs = await AMC.insertMany(
    Array.from(amcCodeMap.entries()).map(([name, code]) => ({ code, name })),
    { ordered: false }
  );
  const amcByName = new Map(amcDocs.map(a => [a.name, a._id]));
  console.log(`✓ Seeded ${amcDocs.length} AMCs`);

  // Build schemes — deduplicate by amcId+schemeCode
  const seenSchemes = new Set();
  const schemeDocs  = [];

  for (const row of rows) {
    const amcName      = str(row[0]);
    const schemeCode   = str(row[1]);
    const schemeName   = str(row[2]);
    const schemeType   = str(row[3]); // Open Ended / Closed Ended
    const schemeCat    = str(row[4]); // e.g. "Equity Scheme - Large & Mid Cap Fund"
    const navName      = str(row[5]);
    const isin         = str(row[9]);

    if (!amcName || !schemeName) continue;

    const amcId  = amcByName.get(amcName);
    if (!amcId) continue;

    const key = `${amcId}::${schemeCode || schemeName}`;
    if (seenSchemes.has(key)) continue;
    seenSchemes.add(key);

    const mfType = inferMfType(schemeCat);
    const dgFlag = inferDgFlag(navName);

    schemeDocs.push({
      amcId,
      schemeCode,
      name: schemeName,
      isin: isin.slice(0, 12), // take first ISIN if concatenated
      mfType,
      dgFlag,
    });
  }

  // Insert in batches to avoid memory issues
  const BATCH = 1000;
  let inserted = 0;
  for (let i = 0; i < schemeDocs.length; i += BATCH) {
    const batch = schemeDocs.slice(i, i + BATCH);
    await Scheme.insertMany(batch, { ordered: false }).catch(() => {});
    inserted += batch.length;
  }

  console.log(`✓ Seeded ${inserted} schemes`);
  return { amcs: amcDocs.length, schemes: inserted };
}

// ── 6. Transactions (Fixed Income, MF, Shares) ───────────────────────────────
function pick(arr, n = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return n === 1 ? shuffled[0] : shuffled.slice(0, n);
}

function daysAgo(d) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

const FI_SUBCATEGORIES = ['BNFD','CNFD','BCFD','CCFD','CD','NCD','PMIS','PTD'];
const SECTORS = ['IT','Banking','Pharma','FMCG','Auto','Energy','Infra','Telecom','Metals','Cement'];

async function seedTransactions() {
  const investors = await Investor.find({});
  const banks     = await Company.find({ flag: 'B' }).limit(20);
  const companies = await Company.find({ flag: 'C' }).limit(100);
  const amcs      = await AMC.find({});
  const schemes   = await Scheme.find({});

  // Group schemes by AMC for fast lookup
  const schemesByAmc = new Map();
  for (const s of schemes) {
    const key = s.amcId.toString();
    if (!schemesByAmc.has(key)) schemesByAmc.set(key, []);
    schemesByAmc.get(key).push(s);
  }

  const fdDocs  = [];
  const mfDocs  = [];
  const shDocs  = [];

  for (const inv of investors) {
    // ── Fixed Income: 2-4 records per investor ──────────────────────────────
    const fdCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < fdCount; i++) {
      const bank        = pick(banks);
      const subcat      = pick(FI_SUBCATEGORIES);
      const effDate     = daysAgo(Math.floor(Math.random() * 730) + 90);
      const tenureMonths= pick([12, 24, 36, 48, 60]);
      const depositAmt  = randomBetween(50000, 1500000);
      const rate        = randomBetween(6.5, 9.0);
      const matDate     = addMonths(effDate, tenureMonths);
      const years       = tenureMonths / 12;
      const matAmt      = Math.round(depositAmt * Math.pow(1 + rate / 100, years));
      const firstIntDate= addMonths(effDate, 3);

      fdDocs.push({
        investorId:        inv._id,
        effectiveDate:     effDate,
        subcategoryCode:   subcat,
        companyId:         bank ? bank._id : null,
        jointHolder1:      '',
        jointHolder2:      '',
        depositAmount:     depositAmt,
        interestRate:      rate,
        firstInterestDate: firstIntDate,
        maturityDate:      matDate,
        maturityAmount:    matAmt,
      });
    }

    // ── Mutual Funds: 2-4 records per investor ──────────────────────────────
    const mfCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < mfCount; i++) {
      const amc = pick(amcs);
      if (!amc) continue;
      const amcSchemes = schemesByAmc.get(amc._id.toString()) || [];
      if (!amcSchemes.length) continue;
      const scheme   = pick(amcSchemes);
      const effDate  = daysAgo(Math.floor(Math.random() * 548) + 60);
      const amount   = randomBetween(10000, 500000);
      const nav      = randomBetween(10, 1500);
      const units    = Math.round((amount / nav) * 1000) / 1000;
      const mfType   = pick(['Dividend', 'Growth']);
      const amcType  = pick(['Large Cap', 'Mid Cap', 'Flexi Cap', '']);
      const txType   = Math.random() > 0.15 ? 'Purchase' : 'Redemption';

      mfDocs.push({
        investorId:   inv._id,
        amcId:        amc._id,
        amcType:      amcType,
        schemeId:     scheme._id,
        effectiveDate:effDate,
        type:         txType,
        mfType:       mfType,
        jointHolder1: '',
        jointHolder2: '',
        amount:       amount,
        nav:          nav,
        units:        units,
      });
    }

    // ── Shares: 3-5 records per investor ───────────────────────────────────
    const shCount = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < shCount; i++) {
      const co      = pick(companies);
      if (!co) continue;
      const effDate = daysAgo(Math.floor(Math.random() * 730) + 30);
      const price   = randomBetween(50, 5000);
      const shares  = Math.floor(Math.random() * 490) + 10;
      const amount  = Math.round(price * shares);
      const exch    = pick(['BSE', 'NSE']);
      const txType  = Math.random() > 0.2 ? 'Purchase' : 'Sales';
      const sector  = co.sector || pick(SECTORS);

      shDocs.push({
        investorId:    inv._id,
        effectiveDate: effDate,
        bseNseFlag:    exch,
        companyId:     co._id,
        isin:          co.isin || '',
        sector:        sector,
        type:          txType,
        jointHolder1:  '',
        jointHolder2:  '',
        amount:        amount,
        price:         price,
        noOfShares:    shares,
      });
    }
  }

  // Bulk insert all
  if (fdDocs.length)  await FixedDeposit.insertMany(fdDocs,  { ordered: false });
  if (mfDocs.length)  await MutualFund.insertMany(mfDocs,    { ordered: false });
  if (shDocs.length)  await Share.insertMany(shDocs,         { ordered: false });

  console.log(`✓ Seeded ${fdDocs.length} Fixed Income, ${mfDocs.length} MF, ${shDocs.length} Share transactions`);
  return { fd: fdDocs.length, mf: mfDocs.length, sh: shDocs.length };
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function runExcelSeed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio_management';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB:', mongoUri);

  await clearAll();

  await seedAdmin();
  await seedCategories();
  await seedGroupsAndInvestors();
  await seedCompanies();
  const { amcs, schemes } = await seedAmcsAndSchemes();
  const txStats = await seedTransactions();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Seed complete!');
  console.log(`  Admin login      : ${ADMIN.username} / ${ADMIN.password}`);
  console.log(`  Groups           : 8   Investors: 22`);
  console.log(`  Companies/Banks  : 2400+`);
  console.log(`  AMCs             : ${amcs}   Schemes: ${schemes}`);
  console.log(`  Fixed Income Tx  : ${txStats.fd}`);
  console.log(`  Mutual Fund Tx   : ${txStats.mf}`);
  console.log(`  Share Tx         : ${txStats.sh}`);
  console.log('═══════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

module.exports = { runExcelSeed };