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
  /** docs/06-tasks/task-078.md: local-filesystem stand-in for the not-yet-provisioned S3/MinIO instance. */
  storageRoot: string;
}
