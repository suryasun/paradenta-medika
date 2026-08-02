export interface AppConfig {
  appName: string;
  appPort: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;
  s3Endpoint: string;
  s3Bucket: string;
  smtpHost: string;
  bcryptSaltRounds: number;
  frontendOrigin: string;
}
