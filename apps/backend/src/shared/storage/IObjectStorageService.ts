/**
 * docs/03-sad/02-system-architecture.md Section 27 (File Storage
 * Architecture) + docs/03-sad/15-module-emr.md Part 3.3A Section 8
 * (Storage Architecture): the abstraction any real S3/MinIO client would
 * implement. `LocalFilesystemStorageService` is the only implementation
 * today (docs/06-tasks/task-078.md: no S3/MinIO instance is provisioned) --
 * use-case code depends only on this interface so swapping in a real
 * client later doesn't touch application code.
 */
export interface StoredObject {
  bucket: string;
  objectKey: string;
  fileSize: number;
}

export interface IObjectStorageService {
  put(bucket: string, objectKey: string, data: Buffer): Promise<StoredObject>;
  read(bucket: string, objectKey: string): Promise<Buffer>;
  /** Section 27.5 "Secure URL, Private Bucket" -- a short-lived, signed download URL. */
  getSignedUrl(bucket: string, objectKey: string, expiresInSeconds: number): string;
  /** Verifies and decodes a signed URL token; throws if invalid/expired. */
  verifySignedToken(token: string): { bucket: string; objectKey: string };
}
