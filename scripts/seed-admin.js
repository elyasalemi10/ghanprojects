// scripts/seed-admin.js
// Creates the initial OWNER user if none exists.
// Usage: node scripts/seed-admin.js
// Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_OWNER_EMAIL, SEED_OWNER_PASSWORD, SEED_OWNER_NAME in .env.local

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.SEED_OWNER_EMAIL || '').toLowerCase();
const password = process.env.SEED_OWNER_PASSWORD;
const name = process.env.SEED_OWNER_NAME || 'Owner';

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
if (!email || !password) {
  console.error('Missing SEED_OWNER_EMAIL or SEED_OWNER_PASSWORD in .env.local');
  console.error('Add them to .env.local and re-run.');
  process.exit(1);
}

const supabase = createClient(url, key);

const existing = await supabase.from('users').select('id, email, role').eq('role', 'OWNER').limit(1);
if (existing.error) {
  console.error('Failed to query users:', existing.error.message);
  process.exit(1);
}
if (existing.data && existing.data.length > 0) {
  console.log(`An OWNER already exists (${existing.data[0].email}). Nothing to do.`);
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 12);

const insert = await supabase.from('users').insert({
  email,
  name,
  password_hash: passwordHash,
  role: 'OWNER',
  active: true,
}).select().single();

if (insert.error) {
  console.error('Failed to create owner:', insert.error.message);
  process.exit(1);
}

console.log('Owner created:');
console.log(`  Email: ${email}`);
console.log(`  Name:  ${name}`);
console.log('You can now log in at /login.');
