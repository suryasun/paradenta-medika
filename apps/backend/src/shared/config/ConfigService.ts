import { AppConfig } from './config.types';

/**
 * REQUIRED_ENV_VARS per docs/06-tasks/task-004.md Backend Scope.
 * FRONTEND_ORIGIN is additionally required because task-005's Security Impact
 * mandates CORS restricted to the documented frontend origin only
 * (docs/04-ai-contract/09-security-contract.md SEC-062).
 */
const REQUIRED_ENV_VARS = [
  'APP_NAME',
  'APP_PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRY',
  'JWT_REFRESH_EXPIRY',
  'S3_ENDPOINT',
  'S3_BUCKET',
  'SMTP_HOST',
  'FRONTEND_ORIGIN',
] as const;

export class ConfigService {
  private readonly config: AppConfig;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const missing = REQUIRED_ENV_VARS.filter((key) => !env[key] || env[key]?.trim() === '');
    if (missing.length > 0) {
      throw new Error(
        `Configuration Service: missing required environment variable(s): ${missing.join(', ')}`,
      );
    }

    const appPort = Number(env.APP_PORT);
    if (!Number.isInteger(appPort) || appPort <= 0) {
      throw new Error('Configuration Service: APP_PORT must be a positive integer');
    }

    const bcryptSaltRounds = env.BCRYPT_SALT_ROUNDS ? Number(env.BCRYPT_SALT_ROUNDS) : 12;
    if (!Number.isInteger(bcryptSaltRounds) || bcryptSaltRounds <= 0) {
      throw new Error('Configuration Service: BCRYPT_SALT_ROUNDS must be a positive integer');
    }

    this.config = {
      appName: env.APP_NAME as string,
      appPort,
      databaseUrl: env.DATABASE_URL as string,
      jwtSecret: env.JWT_SECRET as string,
      jwtRefreshSecret: env.JWT_REFRESH_SECRET as string,
      jwtAccessExpiry: env.JWT_ACCESS_EXPIRY as string,
      jwtRefreshExpiry: env.JWT_REFRESH_EXPIRY as string,
      s3Endpoint: env.S3_ENDPOINT as string,
      s3Bucket: env.S3_BUCKET as string,
      smtpHost: env.SMTP_HOST as string,
      bcryptSaltRounds,
      frontendOrigin: env.FRONTEND_ORIGIN as string,
    };
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  getAll(): Readonly<AppConfig> {
    return this.config;
  }
}
