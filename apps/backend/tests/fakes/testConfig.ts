import { ConfigService } from '../../src/shared/config/ConfigService';

export function testConfig(overrides: NodeJS.ProcessEnv = {}): ConfigService {
  return new ConfigService({
    APP_NAME: 'Parakita',
    APP_PORT: '4000',
    DATABASE_URL: 'mysql://user:pass@localhost:3306/parakita',
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '30d',
    S3_ENDPOINT: 'http://localhost:9000',
    S3_BUCKET: 'bucket',
    SMTP_HOST: 'smtp.example.com',
    FRONTEND_ORIGIN: 'http://localhost:3000',
    ...overrides,
  });
}
