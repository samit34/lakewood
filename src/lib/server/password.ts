import 'server-only';
import { hash, verify } from '@node-rs/argon2';

// argon2id with OWASP-recommended parameters (19 MiB memory, 2 iterations).
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const hashPassword = (password: string) => hash(password, OPTIONS);

// Verified against when the username doesn't exist, so response time doesn't reveal valid usernames.
let dummyHash: Promise<string> | null = null;

export async function verifyPassword(passwordHash: string | null | undefined, password: string) {
  if (!passwordHash) {
    dummyHash ??= hash('not-a-real-password-placeholder', OPTIONS);
    await verify(await dummyHash, password).catch(() => false);
    return false;
  }
  return verify(passwordHash, password).catch(() => false);
}
