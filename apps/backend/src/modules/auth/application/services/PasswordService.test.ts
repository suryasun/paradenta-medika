import { PasswordService } from './PasswordService';
import { testConfig } from '../../../../../tests/fakes/testConfig';

describe('PasswordService', () => {
  const service = new PasswordService(testConfig());
  const context = { username: 'jdoe', email: 'jdoe@example.com' };

  it('hashes and verifies a password round-trip', async () => {
    const hash = await service.hash('Str0ng!Passw0rd');
    expect(hash).not.toBe('Str0ng!Passw0rd');
    await expect(service.verify('Str0ng!Passw0rd', hash)).resolves.toBe(true);
    await expect(service.verify('wrong', hash)).resolves.toBe(false);
  });

  it('accepts a policy-compliant password', () => {
    expect(service.validatePolicy('Str0ng!Passw0rd', context)).toEqual([]);
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(service.validatePolicy('Ab1!', context)).toContain('Password must be at least 8 characters long');
  });

  it('rejects a password missing an uppercase character', () => {
    expect(service.validatePolicy('weak1!weak', context)).toContain(
      'Password must contain at least one uppercase character',
    );
  });

  it('rejects a password missing a special character', () => {
    expect(service.validatePolicy('Weak1Weak', context)).toContain(
      'Password must contain at least one special character',
    );
  });

  it('rejects a password equal to the username', () => {
    expect(service.validatePolicy('jdoe', context)).toContain('Password must not equal the username');
  });

  it('rejects a common password', () => {
    expect(service.validatePolicy('password', context)).toContain('Password must not be a common password');
  });
});
