const fs = require('fs');
const path = require('path');

const target = process.argv[2]; // 'postgresql' or 'sqlite'
if (!target || (target !== 'postgresql' && target !== 'sqlite')) {
  console.error('Usage: node switch-db.js [postgresql|sqlite]');
  process.exit(1);
}

const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

if (target === 'postgresql') {
  schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
} else {
  schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
}

fs.writeFileSync(schemaPath, schema);
console.log(`✓ Prisma schema datasource updated to: ${target}`);
