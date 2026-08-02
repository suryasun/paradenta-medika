import { ConfigService } from './ConfigService';

function validEnv(): NodeJS.ProcessEnv {
  return {
    APP_NAME: 'Parakita',
    APP_PORT: '4000',
    DATABASE_URL: 'mysql://user:pass@localhost:3306/parakita',
    JWT_SECRET: 'secret',
    JWT_REFRESH_SECRET: 'refresh-secret',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    S3_ENDPOINT: 'http://localhost:9000',
    S3_BUCKET: 'bucket',
    SMTP_HOST: 'smtp.example.com',
    FRONTEND_ORIGIN: 'http://localhost:3000',
  };
}

describe('ConfigService', () => {
  it('loads configuration successfully when every required variable is present', () => {
    const service = new ConfigService(validEnv());

    expect(service.get('appName')).toBe('Parakita');
    expect(service.get('appPort')).toBe(4000);
    expect(service.get('bcryptSaltRounds')).toBe(12);
  });

  it('applies BCRYPT_SALT_ROUNDS from the environment when provided', () => {
    const service = new ConfigService({ ...validEnv(), BCRYPT_SALT_ROUNDS: '10' });

    expect(service.get('bcryptSaltRounds')).toBe(10);
  });

  it.each(['APP_NAME', 'DATABASE_URL', 'JWT_SECRET', 'FRONTEND_ORIGIN'])(
    'fails fast when %s is missing',
    (missingKey) => {
      const env = validEnv();
      delete (env as Record<string, string | undefined>)[missingKey];

      expect(() => new ConfigService(env)).toThrow(/missing required environment variable/i);
      expect(() => new ConfigService(env)).toThrow(new RegExp(missingKey));
    },
  );

  it('fails fast when APP_PORT is not a positive integer', () => {
    const env = { ...validEnv(), APP_PORT: 'not-a-number' };

    expect(() => new ConfigService(env)).toThrow(/APP_PORT must be a positive integer/);
  });
});
