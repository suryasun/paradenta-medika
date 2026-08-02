import crypto from 'node:crypto';

/**
 * Refresh tokens and password-reset tokens are opaque random strings; only
 * their SHA-256 hash is ever persisted (docs/04-ai-contract/05-auth-contract.md
 * AUTH-024, docs/06-tasks/task-011.md "storing token hash").
 */
export function generateOpaqueToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashOpaqueToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
