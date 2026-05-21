require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import all models
const User = require('./models/User.model');
const Group = require('./models/Group.model');
const Investor = require('./models/Investor.model');
const Category = require('./models/Category.model');
const Subcategory = require('./models/Subcategory.model');
const Company = require('./models/Company.model');
const AMC = require('./models/AMC.model');
const Scheme = require('./models/Scheme.model');
const FixedDeposit = require('./models/FixedDeposit.model');
const MutualFund = require('./models/MutualFund.model');
const Share = require('./models/Share.model');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🗄️  Connected to MongoDB for seeding...');

  // Clear existing data
  await Promise.all([
    User.deleteMany(),
    Group.deleteMany(),
    Investor.deleteMany(),
    Category.deleteMany(),
    Subcategory.deleteMany(),
    Company.deleteMany(),
    AMC.deleteMany(),
    Scheme.deleteMany(),
    FixedDeposit.deleteMany(),
    MutualFund.deleteMany(),
    Share.deleteMany(),
  ]);
  console.log('🧹 Cleared existing data');

  // Users
  const adminUser = await User.create({
    username: 'admin',
    email: 'admin@pms.com',
    password: 'Admin@123',
    role: 'admin',
  });
  console.log('👤 Created admin user: admin / Admin@123');

  // Groups
  const groups = await Group.insertMany([
    { name: 'Sharma Family', description: 'Sharma family investments', status: 'Active' },
    { name: 'Patel Group', description: 'Patel business group', status: 'Active' },
    { name: 'Gupta HNI', description: 'High net worth individual - Gupta', status: 'Active' },
    { name: 'Mehta Portfolio', description: 'Mehta family portfolio', status: 'Active' },
    { name: 'Singh Associates', description: 'Singh corporate investments', status: 'Active' },
  ]);
  console.log(`✅ Created ${groups.length} groups`);

  // Investors
  const investors = await Investor.insertMany([
    { name: 'Rajesh Sharma', email: 'rajesh@example.com', mobile: '9876543210', pan: 'ABCDE1234F', address: '12 MG Road, Mumbai', groupId: groups[0]._id, status: 'Active' },
    { name: 'Priya Patel', email: 'priya@example.com', mobile: '9876543211', pan: 'PQRST5678G', address: '45 Park Street, Delhi', groupId: groups[1]._id, status: 'Active' },
    { name: 'Amit Gupta', email: 'amit@example.com', mobile: '9876543212', pan: 'LMNOP2345H', address: '78 Brigade Road, Bangalore', groupId: groups[2]._id, status: 'Active' },
    { name: 'Sunita Mehta', email: 'sunita@example.com', mobile: '9876543213', pan: 'UVWXY6789J', address: '23 Anna Nagar, Chennai', groupId: groups[3]._id, status: 'Active' },
    { name: 'Vikram Singh', email: 'vikram@example.com', mobile: '9876543214', pan: 'FGHIJ3456K', address: '56 Civil Lines, Jaipur', groupId: groups[4]._id, status: 'Active' },
    { name: 'Kavita Sharma', email: 'kavita@example.com', mobile: '9876543215', pan: 'BCDEF4567L', address: '34 Sector 21, Gurgaon', groupId: groups[0]._id, status: 'Active' },
    { name: 'Rohit Verma', email: 'rohit@example.com', mobile: '9876543216', pan: 'STUVW7890M', address: '67 Connaught Place, Delhi', groupId: null, status: 'Active' },
  ]);
  console.log(`✅ Created ${investors.length} investors`);

  // Categories
  const categories = await Category.insertMany([
    { name: 'Equity', description: 'Stock market investments' },
    { name: 'Debt', description: 'Fixed income instruments' },
    { name: 'Hybrid', description: 'Mix of equity and debt' },
    { name: 'Gold', description: 'Gold and precious metals' },
    { name: 'International', description: 'International/global funds' },
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // Subcategories
  const subcategories = await Subcategory.insertMany([
    { categoryId: categories[0]._id, name: 'Large Cap', description: 'Top 100 companies by market cap' },
    { categoryId: categories[0]._id, name: 'Mid Cap', description: 'Companies ranked 101-250' },
    { categoryId: categories[0]._id, name: 'Small Cap', description: 'Companies ranked below 250' },
    { categoryId: categories[0]._id, name: 'ELSS', description: 'Equity Linked Savings Scheme' },
    { categoryId: categories[0]._id, name: 'Flexi Cap', description: 'Dynamic allocation across caps' },
    { categoryId: categories[1]._id, name: 'Liquid Fund', description: 'Very short term debt' },
    { categoryId: categories[1]._id, name: 'Short Duration', description: '1-3 year debt instruments' },
    { categoryId: categories[1]._id, name: 'Corporate Bond', description: 'AA+ rated corporate bonds' },
    { categoryId: categories[2]._id, name: 'Aggressive Hybrid', description: '65-80% equity, rest debt' },
    { categoryId: categories[2]._id, name: 'Balanced Hybrid', description: '40-60% equity' },
  ]);
  console.log(`✅ Created ${subcategories.length} subcategories`);

  // Companies (for shares)
  const companies = await Company.insertMany([
    { name: 'Reliance Industries', symbol: 'RELIANCE', sector: 'Energy', industry: 'Oil & Gas', status: 'Active' },
    { name: 'Tata Consultancy Services', symbol: 'TCS', sector: 'Technology', industry: 'IT Services', status: 'Active' },
    { name: 'HDFC Bank', symbol: 'HDFCBANK', sector: 'Finance', industry: 'Banking', status: 'Active' },
    { name: 'Infosys', symbol: 'INFY', sector: 'Technology', industry: 'IT Services', status: 'Active' },
    { name: 'Wipro', symbol: 'WIPRO', sector: 'Technology', industry: 'IT Services', status: 'Active' },
    { name: 'ICICI Bank', symbol: 'ICICIBANK', sector: 'Finance', industry: 'Banking', status: 'Active' },
    { name: 'Bajaj Finance', symbol: 'BAJFINANCE', sector: 'Finance', industry: 'NBFC', status: 'Active' },
    { name: 'Asian Paints', symbol: 'ASIANPAINT', sector: 'Consumer', industry: 'Paints', status: 'Active' },
  ]);
  console.log(`✅ Created ${companies.length} companies`);

  // AMCs
  const amcs = await AMC.insertMany([
    { name: 'SBI Mutual Fund', registrationNo: 'MF-2001-01', email: 'contact@sbimf.com', phone: '1800-425-5425', status: 'Active' },
    { name: 'HDFC Mutual Fund', registrationNo: 'MF-2000-02', email: 'contact@hdfcmf.com', phone: '1800-3010-6767', status: 'Active' },
    { name: 'ICICI Prudential AMC', registrationNo: 'MF-1999-03', email: 'invest@icicipruamc.com', phone: '1800-200-6666', status: 'Active' },
    { name: 'Axis Mutual Fund', registrationNo: 'MF-2009-04', email: 'invest@axismf.com', phone: '1800-221-322', status: 'Active' },
    { name: 'Mirae Asset AMC', registrationNo: 'MF-2008-05', email: 'info@miraeasset.com', phone: '1800-209-4400', status: 'Active' },
    { name: 'Nippon India AMC', registrationNo: 'MF-1995-06', email: 'service@nipponindiaim.com', phone: '1800-300-11111', status: 'Active' },
  ]);
  console.log(`✅ Created ${amcs.length} AMCs`);

  // Schemes
  const schemes = await Scheme.insertMany([
    { name: 'SBI Bluechip Fund - Direct Growth', amcId: amcs[0]._id, categoryId: categories[0]._id, subcategoryId: subcategories[0]._id, riskLevel: 'High', nav: 72.45, status: 'Active' },
    { name: 'HDFC Mid-Cap Opportunities - Direct Growth', amcId: amcs[1]._id, categoryId: categories[0]._id, subcategoryId: subcategories[1]._id, riskLevel: 'Very High', nav: 138.92, status: 'Active' },
    { name: 'ICICI Pru Balanced Advantage - Direct Growth', amcId: amcs[2]._id, categoryId: categories[2]._id, subcategoryId: subcategories[8]._id, riskLevel: 'Moderate', nav: 58.67, status: 'Active' },
    { name: 'Axis Long Term Equity - Direct Growth', amcId: amcs[3]._id, categoryId: categories[0]._id, subcategoryId: subcategories[3]._id, riskLevel: 'High', nav: 89.23, status: 'Active' },
    { name: 'Mirae Asset Large Cap - Direct Growth', amcId: amcs[4]._id, categoryId: categories[0]._id, subcategoryId: subcategories[0]._id, riskLevel: 'High', nav: 112.34, status: 'Active' },
    { name: 'Nippon India Liquid Fund - Direct Growth', amcId: amcs[5]._id, categoryId: categories[1]._id, subcategoryId: subcategories[5]._id, riskLevel: 'Low', nav: 5423.78, status: 'Active' },
    { name: 'SBI Small Cap Fund - Direct Growth', amcId: amcs[0]._id, categoryId: categories[0]._id, subcategoryId: subcategories[2]._id, riskLevel: 'Very High', nav: 143.67, status: 'Active' },
    { name: 'HDFC Flexicap Fund - Direct Growth', amcId: amcs[1]._id, categoryId: categories[0]._id, subcategoryId: subcategories[4]._id, riskLevel: 'High', nav: 165.43, status: 'Active' },
  ]);
  console.log(`✅ Created ${schemes.length} schemes`);

  // Fixed Deposits
  const fdData = [
    { investorId: investors[0]._id, bankName: 'SBI Bank', fdNumber: 'FD-SBI-001', effectiveDate: new Date('2024-01-15'), amount: 500000, interestRate: 7.5, tenureMonths: 24, maturityDate: new Date('2026-01-15'), interestFrequency: 'Quarterly', status: 'Active' },
    { investorId: investors[1]._id, bankName: 'HDFC Bank', fdNumber: 'FD-HDFC-002', effectiveDate: new Date('2024-03-01'), amount: 300000, interestRate: 7.25, tenureMonths: 12, maturityDate: new Date('2025-03-01'), interestFrequency: 'Monthly', status: 'Active' },
    { investorId: investors[2]._id, bankName: 'ICICI Bank', fdNumber: 'FD-ICICI-003', effectiveDate: new Date('2023-06-15'), amount: 1000000, interestRate: 7.8, tenureMonths: 36, maturityDate: new Date('2026-06-15'), interestFrequency: 'Yearly', status: 'Active' },
    { investorId: investors[3]._id, bankName: 'Axis Bank', fdNumber: 'FD-AXIS-004', effectiveDate: new Date('2024-05-01'), amount: 250000, interestRate: 7.0, tenureMonths: 18, maturityDate: new Date('2025-11-01'), interestFrequency: 'On Maturity', status: 'Active' },
    { investorId: investors[4]._id, bankName: 'Kotak Bank', fdNumber: 'FD-KOT-005', effectiveDate: new Date('2023-12-01'), amount: 750000, interestRate: 7.6, tenureMonths: 24, maturityDate: new Date('2025-12-01'), interestFrequency: 'Half-Yearly', status: 'Active' },
    { investorId: investors[0]._id, bankName: 'PNB Bank', fdNumber: 'FD-PNB-006', effectiveDate: new Date('2022-08-10'), amount: 400000, interestRate: 6.8, tenureMonths: 24, maturityDate: new Date('2024-08-10'), interestFrequency: 'Quarterly', status: 'Matured' },
  ];

  // Calculate maturity amounts
  const fdsWithCalc = fdData.map((fd) => {
    const years = fd.tenureMonths / 12;
    const maturityAmount = fd.amount * Math.pow(1 + fd.interestRate / 100, years);
    return {
      ...fd,
      maturityAmount: parseFloat(maturityAmount.toFixed(2)),
      interestEarned: parseFloat((maturityAmount - fd.amount).toFixed(2)),
    };
  });

  const fds = await FixedDeposit.insertMany(fdsWithCalc);
  console.log(`✅ Created ${fds.length} fixed deposits`);

  // Mutual Fund Transactions
  const mfTransactions = await MutualFund.insertMany([
    { investorId: investors[0]._id, amcId: amcs[0]._id, schemeId: schemes[0]._id, transactionDate: new Date('2024-01-10'), type: 'Purchase', units: 1386.12, nav: 72.00, amount: 100000 },
    { investorId: investors[0]._id, amcId: amcs[1]._id, schemeId: schemes[1]._id, transactionDate: new Date('2024-02-15'), type: 'Purchase', units: 719.09, nav: 138.00, amount: 99234 },
    { investorId: investors[1]._id, amcId: amcs[2]._id, schemeId: schemes[2]._id, transactionDate: new Date('2024-03-01'), type: 'Purchase', units: 2560.44, nav: 58.50, amount: 149786 },
    { investorId: investors[2]._id, amcId: amcs[3]._id, schemeId: schemes[3]._id, transactionDate: new Date('2024-01-20'), type: 'Purchase', units: 561.80, nav: 89.00, amount: 50000 },
    { investorId: investors[2]._id, amcId: amcs[3]._id, schemeId: schemes[3]._id, transactionDate: new Date('2024-04-10'), type: 'Redemption', units: 100.00, nav: 89.23, amount: 8923 },
    { investorId: investors[3]._id, amcId: amcs[4]._id, schemeId: schemes[4]._id, transactionDate: new Date('2024-02-28'), type: 'Purchase', units: 890.18, nav: 112.00, amount: 99700 },
    { investorId: investors[4]._id, amcId: amcs[0]._id, schemeId: schemes[6]._id, transactionDate: new Date('2024-03-15'), type: 'Purchase', units: 1044.96, nav: 143.35, amount: 149800 },
    { investorId: investors[5]._id, amcId: amcs[1]._id, schemeId: schemes[7]._id, transactionDate: new Date('2024-04-01'), type: 'Purchase', units: 1513.04, nav: 165.23, amount: 250000 },
    { investorId: investors[0]._id, amcId: amcs[5]._id, schemeId: schemes[5]._id, transactionDate: new Date('2024-05-01'), type: 'Purchase', units: 18.44, nav: 5422.50, amount: 100000 },
    { investorId: investors[6]._id, amcId: amcs[2]._id, schemeId: schemes[2]._id, transactionDate: new Date('2024-05-10'), type: 'Purchase', units: 854.41, nav: 58.52, amount: 50000 },
  ]);
  console.log(`✅ Created ${mfTransactions.length} MF transactions`);

  // Share Transactions
  const shareTransactions = [
    { investorId: investors[0]._id, companyId: companies[0]._id, transactionDate: new Date('2024-01-05'), type: 'Buy', quantity: 50, price: 2800, brokerage: 280 },
    { investorId: investors[0]._id, companyId: companies[1]._id, transactionDate: new Date('2024-01-10'), type: 'Buy', quantity: 30, price: 3900, brokerage: 350 },
    { investorId: investors[1]._id, companyId: companies[2]._id, transactionDate: new Date('2024-02-01'), type: 'Buy', quantity: 100, price: 1650, brokerage: 500 },
    { investorId: investors[2]._id, companyId: companies[3]._id, transactionDate: new Date('2024-02-15'), type: 'Buy', quantity: 200, price: 1680, brokerage: 1000 },
    { investorId: investors[2]._id, companyId: companies[3]._id, transactionDate: new Date('2024-04-10'), type: 'Sell', quantity: 50, price: 1780, brokerage: 250 },
    { investorId: investors[3]._id, companyId: companies[4]._id, transactionDate: new Date('2024-03-01'), type: 'Buy', quantity: 75, price: 480, brokerage: 200 },
    { investorId: investors[4]._id, companyId: companies[5]._id, transactionDate: new Date('2024-03-15'), type: 'Buy', quantity: 60, price: 1100, brokerage: 400 },
    { investorId: investors[5]._id, companyId: companies[6]._id, transactionDate: new Date('2024-04-01'), type: 'Buy', quantity: 20, price: 7100, brokerage: 500 },
    { investorId: investors[0]._id, companyId: companies[7]._id, transactionDate: new Date('2024-04-20'), type: 'Buy', quantity: 40, price: 3250, brokerage: 400 },
    { investorId: investors[1]._id, companyId: companies[0]._id, transactionDate: new Date('2024-05-01'), type: 'Buy', quantity: 25, price: 2900, brokerage: 150 },
  ];

  // Calculate totalAmount for each
  const sharesWithCalc = shareTransactions.map((s) => ({
    ...s,
    totalAmount: s.quantity * s.price + s.brokerage,
  }));

  const shares = await Share.insertMany(sharesWithCalc);
  console.log(`✅ Created ${shares.length} share transactions`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Login Credentials:');
  console.log('   Username: admin');
  console.log('   Password: Admin@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
