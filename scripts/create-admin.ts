/**
 * Creates the FIRST admin (role: owner). Run: npm run create-admin
 * Further admins are added by an owner from /admin/admins. This script refuses to run once any admin exists.
 */
import fs from 'node:fs';
import readline from 'node:readline';
import mongoose from 'mongoose';
import { checkPassword } from '@/lib/password-policy';
import { audit } from '@/lib/server/audit';
import { connectDb } from '@/lib/server/db';
import { Admin } from '@/lib/server/models';
import { hashPassword } from '@/lib/server/password';

for (const file of ['.env.local', '.env']) if (fs.existsSync(file)) process.loadEnvFile(file);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
let muted = false;
const out = rl as unknown as { _writeToOutput: (s: string) => void };
const write = out._writeToOutput.bind(out);
out._writeToOutput = (s: string) => (muted ? write(s.includes('\n') || s.includes('\r') ? s : '*'.repeat(s.length)) : write(s));

// Lines are queued so piped input that arrives before a prompt is not lost.
const lines: string[] = [];
let waiting: ((line: string) => void) | null = null;
let closed = false;
rl.on('line', (line) => (waiting ? (waiting(line), (waiting = null)) : lines.push(line)));
rl.on('close', () => {
  closed = true;
  waiting?.('');
});

const ask = async (q: string, hidden = false) => {
  if (closed && lines.length === 0) throw new Error('Input ended before all questions were answered.');
  process.stdout.write(q);
  muted = hidden;
  const answer = lines.length ? lines.shift()! : await new Promise<string>((resolve) => (waiting = resolve));
  muted = false;
  if (hidden || !process.stdin.isTTY) process.stdout.write('\n');
  return answer.trim();
};

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set. Add it to .env.local first.');
  await connectDb();

  if ((await Admin.countDocuments()) > 0) {
    console.error('\nAn admin account already exists. Sign in at /admin/login; owners can add more admins under "Admins".');
    process.exitCode = 1;
    return;
  }

  console.log('\nCreate the first Lakewood admin (owner)\n');
  let username = '';
  while (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    username = (await ask('Username (3–32 letters/numbers): ')).toLowerCase();
  }
  let email = '';
  while (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) email = (await ask('Email: ')).toLowerCase();

  let password = '';
  for (;;) {
    password = await ask('Password (min 12 characters, hidden): ', true);
    const check = checkPassword(password, [username, email]);
    if (!check.ok) {
      console.log(`  ✗ ${check.problems.join('\n  ✗ ')}`);
      continue;
    }
    if ((await ask('Repeat password: ', true)) !== password) {
      console.log('  ✗ Passwords do not match.');
      continue;
    }
    break;
  }

  const admin = await Admin.create({ username, email, role: 'owner', passwordHash: await hashPassword(password), passwordChangedAt: new Date() });
  await audit('system', 'admin_created', { target: username, after: { username, email, role: 'owner', via: 'create-admin script' } });
  console.log(`\n✓ Owner "${admin.username}" created. Sign in at /admin/login and turn on two-factor login under Settings.\n`);
}

main()
  .catch((e) => {
    console.error('\n✗', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await mongoose.disconnect();
  });
