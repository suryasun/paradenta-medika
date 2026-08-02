import request from 'supertest';
import { ConfigService } from '../../src/shared/config/ConfigService';
import { createApp } from '../../src/app';

function testConfig(): ConfigService {
  return new ConfigService({
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
  });
}

describe('GET /health', () => {
  it('returns 200 with the standard success envelope', async () => {
    const app = createApp(testConfig());

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: { status: 'ok' },
    });
    expect(response.headers['x-correlation-id']).toBeDefined();
  });
});

describe('GET /unknown-route', () => {
  it('returns 404 with the standard error envelope', async () => {
    const app = createApp(testConfig());

    const response = await request(app).get('/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      code: 'NOT_FOUND',
      message: expect.any(String),
      errors: [],
    });
  });
});
