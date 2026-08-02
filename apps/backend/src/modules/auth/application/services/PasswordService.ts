import bcrypt from 'bcrypt';
import { ConfigService } from '../../../../shared/config/ConfigService';

/**
 * docs/04-ai-contract/05-auth-contract.md AUTH-061: forbidden common
 * passwords. The SAD only names these three examples; the list is not
 * exhaustive elsewhere in the SAD, so only the documented examples are used.
 */
const COMMON_PASSWORDS = ['123456', 'password', 'admin'];

const SPECIAL_CHARACTER_PATTERN = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;

export interface PasswordPolicyContext {
  username: string;
  email: string;
}

export class PasswordService {
  constructor(private readonly config: ConfigService) {}

  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.config.get('bcryptSaltRounds'));
  }

  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }

  /**
   * Returns the list of policy violations (empty when compliant), per
   * AUTH-056 to AUTH-061. AUTH-060 ("password MUST NOT contain the user's
   * name") is NOT enforced here: the Phase 1 `users` table (task-003) has no
   * name/full-name field to check against -- flagged as a gap rather than
   * silently skipped.
   */
  validatePolicy(password: string, context: PasswordPolicyContext): string[] {
    const violations: string[] = [];

    if (password.length < 8) {
      violations.push('Password must be at least 8 characters long');
    }
    if (password.length > 64) {
      violations.push('Password must be at most 64 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      violations.push('Password must contain at least one uppercase character');
    }
    if (!/[a-z]/.test(password)) {
      violations.push('Password must contain at least one lowercase character');
    }
    if (!/[0-9]/.test(password)) {
      violations.push('Password must contain at least one number');
    }
    if (!SPECIAL_CHARACTER_PATTERN.test(password)) {
      violations.push('Password must contain at least one special character');
    }
    if (password.toLowerCase() === context.username.toLowerCase()) {
      violations.push('Password must not equal the username');
    }
    if (password.toLowerCase() === context.email.toLowerCase()) {
      violations.push('Password must not equal the email');
    }
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
      violations.push('Password must not be a common password');
    }

    return violations;
  }
}
