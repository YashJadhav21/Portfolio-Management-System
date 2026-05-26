require('dotenv').config();
const mongoose = require('mongoose');

const Group = require('./models/Group.model');
const Investor = require('./models/Investor.model');
const Category = require('./models/Category.model');
const Subcategory = require('./models/Subcategory.model');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pms';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

async function seedSampleData() {
    // 1. Group
    const group = await Group.findOneAndUpdate(
        { name: 'Family (Devasthali)' },
        { name: 'Family (Devasthali)', description: 'Devasthali family accounts' },
        { upsert: true, new: true }
    );

    // 2. Investors
    const investors = [
        { name: 'Amol', email: 'amol@example.com', mobile: '9000000001', pan: 'ABCDE1111A' },
        { name: 'Gauri', email: 'gauri@example.com', mobile: '9000000002', pan: 'ABCDE2222A' },
        { name: 'Ankita', email: 'ankita@example.com', mobile: '9000000003', pan: 'ABCDE3333A' },
    ];
    for (let inv of investors) {
        await Investor.findOneAndUpdate(
            { name: inv.name },
            { ...inv, groupId: group._id },
            { upsert: true }
        );
    }

    // 3. Categories and Sub-categories
    const catsAndSubs = {
        'Fixed Income Securities': ['BNFD', 'CNFD', 'BCFD', 'CCFD', 'CD', 'NCD', 'PMIS', 'PTD', 'Insurance Annuity'],
        'Mutual Funds': ['Dividend', 'Growth'],
        'Shares': ['Co-operative Bank', 'Preference', 'Equity'],
        'Insurance': ['Endowment', 'ULIP', 'Term Insurance', 'Retirement / Pension']
    };

    for (const [catName, subs] of Object.entries(catsAndSubs)) {
        const cat = await Category.findOneAndUpdate(
            { name: catName },
            { name: catName, type: catName === 'Shares' ? 'Equity' : 'Asset' },
            { upsert: true, new: true }
        );

        for (const subName of subs) {
            await Subcategory.findOneAndUpdate(
                { name: subName, categoryId: cat._id },
                { name: subName, categoryId: cat._id },
                { upsert: true }
            );
        }
    }

    console.log('Sample Data Seeding completed successfully!');
}

async function run() {
  try {
    await connectDB();
    await seedSampleData();
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

run();