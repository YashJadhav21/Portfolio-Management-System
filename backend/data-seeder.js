const { runExcelSeed } = require('./seeders/excel-seeder');

runExcelSeed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});