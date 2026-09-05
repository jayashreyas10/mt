const { execSync } = require('child_process');

console.log('Applying Prisma database migrations...');
try {
  execSync('npx prisma migrate deploy --schema=backend/prisma/schema.prisma', { stdio: 'inherit' });
  console.log('Prisma migrations applied successfully.');
} catch (err) {
  console.log('Migrate deploy flagged un-baselined existing schema (P3005). Baselining initial migration...');
  try {
    execSync('npx prisma migrate resolve --applied 20260905000000_init --schema=backend/prisma/schema.prisma', { stdio: 'inherit' });
    console.log('Successfully baselined 20260905000000_init.');
    execSync('npx prisma migrate deploy --schema=backend/prisma/schema.prisma', { stdio: 'inherit' });
    console.log('Prisma migrations applied successfully.');
  } catch (baselineErr) {
    console.error('Failed during baseline or migration deployment:', baselineErr);
    process.exit(1);
  }
}
