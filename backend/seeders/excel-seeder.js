require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const XLSX = require('xlsx');

const User = require('../models/User.model');
const Group = require('../models/Group.model');
const Investor = require('../models/Investor.model');
const Category = require('../models/Category.model');
const Subcategory = require('../models/Subcategory.model');
const Bank = require('../models/Bank.model');
const Company = require('../models/Company.model');
const AMC = require('../models/AMC.model');
const Scheme = require('../models/Scheme.model');
const FixedDeposit = require('../models/FixedDeposit.model');
const MutualFund = require('../models/MutualFund.model');
const Share = require('../models/Share.model');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DEFAULT_FILES = {
  equity: path.join(ROOT_DIR, 'Equity.csv'),
  nse: path.join(ROOT_DIR, 'List of Scrips traded on NSE (1).xlsx'),
  bse: path.join(ROOT_DIR, 'List of Scrips traded on BSE.xlsx'),
  schemes: path.join(ROOT_DIR, 'List of Mutual Funds AMC wise & Scheme-wise (1).xlsx'),
};

const COLLECTIONS_TO_CLEAR = [
  User,
  Group,
  Investor,
  Category,
  Subcategory,
  Bank,
  Company,
  AMC,
  Scheme,
  FixedDeposit,
  MutualFund,
  Share,
];

const ADMIN_ACCOUNT = {
  username: process.env.SEED_ADMIN_USERNAME || 'admin',
  email: process.env.SEED_ADMIN_EMAIL || 'admin@pms.com',
  password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
};

function assertFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing source file: ${filePath}`);
  }
}

function readRows(filePath, sheetName) {
  assertFileExists(filePath);
  const workbook = XLSX.readFile(filePath);
  const targetSheet = sheetName || workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[targetSheet], {
    header: 1,
    defval: '',
    raw: true,
  });
}

function cleanString(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function cleanNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const numeric = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function parseExcelDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) {
      return null;
    }

    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeExchange(existingExchange, nextExchange) {
  if (existingExchange === nextExchange) {
    return existingExchange;
  }

  if (existingExchange === 'Both' || nextExchange === 'Both') {
    return 'Both';
  }

  return 'Both';
}

function splitSchemeCategory(rawCategory) {
  const categoryLabel = cleanString(rawCategory);

  if (!categoryLabel) {
    return { categoryName: '', subcategoryName: '' };
  }

  const separator = ' - ';
  const separatorIndex = categoryLabel.indexOf(separator);

  if (separatorIndex === -1) {
    return { categoryName: categoryLabel, subcategoryName: '' };
  }

  return {
    categoryName: categoryLabel.slice(0, separatorIndex).trim(),
    subcategoryName: categoryLabel.slice(separatorIndex + separator.length).trim(),
  };
}

function buildNseCompany(row) {
  const symbol = cleanString(row[0]).toUpperCase();

  if (!symbol) {
    return null;
  }

  return {
    symbol,
    name: cleanString(row[1]),
    exchange: 'NSE',
    series: cleanString(row[2]),
    listedOn: parseExcelDate(row[3]),
    paidUpValue: cleanNumber(row[4]),
    marketLot: cleanNumber(row[5]),
    isin: cleanString(row[6]),
    faceValue: cleanNumber(row[7]),
    status: 'Active',
  };
}

function buildBseCompany(row) {
  const symbol = cleanString(row[2]).toUpperCase();

  if (!symbol) {
    return null;
  }

  return {
    symbol,
    name: cleanString(row[3]),
    exchange: 'BSE',
    securityCode: cleanString(row[0]),
    issuerName: cleanString(row[1]),
    securityId: cleanString(row[2]),
    securityName: cleanString(row[3]),
    status: cleanString(row[4]) || 'Active',
    bseGroup: cleanString(row[5]),
    faceValue: cleanNumber(row[6]),
    isin: cleanString(row[7]),
    instrument: cleanString(row[8]),
  };
}

function buildEquityCompany(row) {
  const symbol = cleanString(row[2]).toUpperCase();

  if (!symbol) {
    return null;
  }

  return {
    symbol,
    name: cleanString(row[3]),
    exchange: 'BSE',
    securityCode: cleanString(row[0]),
    issuerName: cleanString(row[1]),
    securityId: cleanString(row[2]),
    securityName: cleanString(row[3]),
    status: cleanString(row[4]) || 'Active',
    bseGroup: cleanString(row[5]),
    faceValue: cleanNumber(row[6]),
    isin: cleanString(row[7]),
    instrument: cleanString(row[8]),
  };
}

function mergeCompanyRecord(existing, incoming) {
  const merged = { ...existing };

  for (const [key, value] of Object.entries(incoming)) {
    if (value === '' || value === null || value === undefined) {
      continue;
    }

    if (key === 'exchange') {
      merged.exchange = normalizeExchange(merged.exchange, value);
      continue;
    }

    if (key === 'name') {
      if (!merged.name || value.length > merged.name.length) {
        merged.name = value;
      }
      continue;
    }

    if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
      merged[key] = value;
    }
  }

  return merged;
}

async function clearCollections() {
  await Promise.all(COLLECTIONS_TO_CLEAR.map((model) => model.deleteMany({})));
}

async function seedAdminUser() {
  return User.create({
    username: ADMIN_ACCOUNT.username,
    email: ADMIN_ACCOUNT.email,
    password: ADMIN_ACCOUNT.password,
    role: 'admin',
  });
}

async function seedCompanies() {
  const equityRows = readRows(DEFAULT_FILES.equity).slice(1);
  const nseRows = readRows(DEFAULT_FILES.nse).slice(1);
  const bseRows = readRows(DEFAULT_FILES.bse).slice(1);
  const companyMap = new Map();

  for (const row of equityRows) {
    const company = buildEquityCompany(row);
    if (!company) {
      continue;
    }

    companyMap.set(company.symbol, company);
  }

  for (const row of nseRows) {
    const company = buildNseCompany(row);
    if (!company) {
      continue;
    }

    companyMap.set(company.symbol, company);
  }

  for (const row of bseRows) {
    const company = buildBseCompany(row);
    if (!company) {
      continue;
    }

    if (companyMap.has(company.symbol)) {
      companyMap.set(company.symbol, mergeCompanyRecord(companyMap.get(company.symbol), company));
    } else {
      companyMap.set(company.symbol, company);
    }
  }

  const companies = Array.from(companyMap.values()).map((company) => ({
    ...company,
    name: company.name || company.symbol,
    sector: '',
    industry: '',
    status: company.status || 'Active',
    exchange: company.exchange || 'Both',
  }));

  if (!companies.length) {
    return 0;
  }

  await Company.insertMany(companies, { ordered: false });
  return companies.length;
}

async function seedAmcsAndSchemes() {
  const rows = readRows(DEFAULT_FILES.schemes).slice(1);
  const amcNames = new Set();
  const schemeRows = [];
  const categoryNames = new Set();
  const subcategoryRows = [];

  for (const row of rows) {
    const amcName = cleanString(row[0]);
    const code = cleanString(row[1]);
    const schemeName = cleanString(row[2]);
    const schemeType = cleanString(row[3]);
    const schemeCategory = cleanString(row[4]);
    const schemeNavName = cleanString(row[5]);
    const minimumAmount = cleanString(row[6]);
    const launchDate = parseExcelDate(row[7]);
    const closureDate = parseExcelDate(row[8]);
    const isin = cleanString(row[9]);

    if (!amcName || !schemeName) {
      continue;
    }

    amcNames.add(amcName);
    schemeRows.push({
      amcName,
      code,
      name: schemeName,
      schemeType,
      schemeCategory,
      schemeNavName,
      minimumAmount,
      launchDate,
      closureDate,
      isin,
    });

    const { categoryName, subcategoryName } = splitSchemeCategory(schemeCategory);
    if (categoryName) {
      categoryNames.add(categoryName);
      if (subcategoryName) {
        subcategoryRows.push({ categoryName, name: subcategoryName });
      }
    }
  }

  const categories = await Category.insertMany(
    Array.from(categoryNames).map((name) => ({ name, description: '' })),
    { ordered: false }
  );
  const categoryMap = new Map(categories.map((category) => [category.name, category._id]));

  const subcategoryRecords = [];
  const seenSubcategories = new Set();
  for (const row of subcategoryRows) {
    const key = `${row.categoryName}::${row.name}`;
    if (seenSubcategories.has(key)) {
      continue;
    }

    seenSubcategories.add(key);
    subcategoryRecords.push({
      categoryId: categoryMap.get(row.categoryName),
      name: row.name,
      description: '',
    });
  }

  const subcategories = subcategoryRecords.length
    ? await Subcategory.insertMany(subcategoryRecords, { ordered: false })
    : [];
  const subcategoryMap = new Map(
    subcategories.map((subcategory) => [`${subcategory.categoryId.toString()}::${subcategory.name}`, subcategory._id])
  );

  const amcs = await AMC.insertMany(
    Array.from(amcNames).map((name) => ({ name, status: 'Active' })),
    { ordered: false }
  );
  const amcMap = new Map(amcs.map((amc) => [amc.name, amc._id]));

  const schemes = schemeRows.map((schemeRow) => {
    const { categoryName, subcategoryName } = splitSchemeCategory(schemeRow.schemeCategory);
    const categoryId = categoryMap.get(categoryName) || null;
    const subcategoryId = subcategoryName && categoryId
      ? subcategoryMap.get(`${categoryId.toString()}::${subcategoryName}`) || null
      : null;

    return {
      code: schemeRow.code,
      name: schemeRow.name,
      amcId: amcMap.get(schemeRow.amcName),
      categoryId,
      subcategoryId,
      schemeType: schemeRow.schemeType,
      schemeCategory: schemeRow.schemeCategory,
      schemeNavName: schemeRow.schemeNavName,
      minimumAmount: schemeRow.minimumAmount,
      launchDate: schemeRow.launchDate,
      closureDate: schemeRow.closureDate,
      isin: schemeRow.isin,
      riskLevel: 'Moderate',
      nav: 0,
      status: 'Active',
    };
  });

  await Scheme.insertMany(schemes, { ordered: false });

  return {
    amcs: amcs.length,
    categories: categories.length,
    subcategories: subcategories.length,
    schemes: schemes.length,
  };
}

async function seedGroupsAndInvestors() {
  const groupsData = [
    { name: 'Retail Investors', description: 'Individual retail investors', status: 'Active' },
    { name: 'High Net Worth Individuals', description: 'HNI investors', status: 'Active' },
    { name: 'Institutional', description: 'Institutional investor groups', status: 'Active' },
  ];

  const groups = await Group.insertMany(groupsData, { ordered: true });
  const groupMap = new Map(groups.map((g) => [g.name, g._id]));

  const sampleInvestors = [
    { name: 'Amit Sharma', email: 'amit.sharma@example.com', mobile: '9000000001', pan: 'ASDPA0001A', address: 'Mumbai', groupName: 'Retail Investors' },
    { name: 'Neha Gupta', email: 'neha.gupta@example.com', mobile: '9000000002', pan: 'NGUPA0002B', address: 'Pune', groupName: 'Retail Investors' },
    { name: 'Rohit Verma', email: 'rohit.verma@example.com', mobile: '9000000003', pan: 'RVEMA0003C', address: 'Delhi', groupName: 'High Net Worth Individuals' },
    { name: 'Sanjay Rao', email: 'sanjay.rao@example.com', mobile: '9000000004', pan: 'SRRAO0004D', address: 'Bengaluru', groupName: 'High Net Worth Individuals' },
    { name: 'Global Trust', email: 'contact@globaltrust.example', mobile: '9000000005', pan: 'GTTRU0005E', address: 'Chennai', groupName: 'Institutional' },
    { name: 'Kavita Singh', email: 'kavita.singh@example.com', mobile: '9000000006', pan: 'KVSIN0006F', address: 'Kolkata', groupName: 'Retail Investors' },
    { name: 'Pradeep Mehta', email: 'pradeep.mehta@example.com', mobile: '9000000007', pan: 'PMEHT0007G', address: 'Ahmedabad', groupName: 'Retail Investors' },
    { name: 'Fortune Capital', email: 'info@fortunecapital.example', mobile: '9000000008', pan: 'FNCAP0008H', address: 'Mumbai', groupName: 'Institutional' },
    { name: 'Anjali Roy', email: 'anjali.roy@example.com', mobile: '9000000009', pan: 'AJROY0009I', address: 'Lucknow', groupName: 'Retail Investors' },
    { name: 'Vikas Jain', email: 'vikas.jain@example.com', mobile: '9000000010', pan: 'VKJAI0010J', address: 'Jaipur', groupName: 'Retail Investors' },
  ];

  const investorDocs = sampleInvestors.map((inv) => ({
    name: inv.name,
    email: inv.email,
    mobile: inv.mobile,
    pan: inv.pan,
    address: inv.address,
    groupId: groupMap.get(inv.groupName) || null,
    status: 'Active',
  }));

  const investors = await Investor.insertMany(investorDocs, { ordered: true });

  return { groups: groups.length, investors: investors.length };
}

async function runExcelSeed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pms';

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  await clearCollections();
  console.log('Cleared existing collections');

  const adminUser = await seedAdminUser();
  const companyCount = await seedCompanies();
  const schemeStats = await seedAmcsAndSchemes();
  const groupInvestorStats = await seedGroupsAndInvestors();

  console.log(`Seeded admin user: ${adminUser.username} / ${ADMIN_ACCOUNT.password}`);
  console.log(`Seeded ${companyCount} companies from Equity.csv plus NSE and BSE workbooks`);
  console.log(`Seeded ${schemeStats.amcs} AMCs, ${schemeStats.categories} categories, ${schemeStats.subcategories} subcategories, and ${schemeStats.schemes} schemes from the mutual fund workbook`);
  console.log(`Seeded ${groupInvestorStats.groups} groups and ${groupInvestorStats.investors} investors as sample data`);
  console.log('No fabricated investment transactions were inserted.');

  await mongoose.disconnect();
}

module.exports = { runExcelSeed };