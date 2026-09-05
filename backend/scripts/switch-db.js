import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
