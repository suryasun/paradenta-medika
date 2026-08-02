import { promises as fs } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { IObjectStorageService, StoredObject } from './IObjectStorageService';

interface SignedUrlPayload {
  bucket: string;
  objectKey: string;
}

/**
 * docs/06-tasks/task-078.md: local-disk stand-in for S3/MinIO. Files are
 * written under `storageRoot/bucket/objectKey`; "signed URLs" are a JWT
 * (reusing the already-approved `jsonwebtoken` dependency rather than
 * introducing a new signing library) embedding {bucket, objectKey} with a
 * short expiry, verified by the download route.
 */
export class LocalFilesystemStorageService implements IObjectStorageService {
  constructor(
    private readonly storageRoot: string,
    private readonly signingSecret: string,
  ) {}

  private resolvePath(bucket: string, objectKey: string): string {
    const safeObjectKey = objectKey.replace(/\.\./g, '');
    return path.join(this.storageRoot, bucket, safeObjectKey);
  }

  async put(bucket: string, objectKey: string, data: Buffer): Promise<StoredObject> {
    const filePath = this.resolvePath(bucket, objectKey);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    return { bucket, objectKey, fileSize: data.length };
  }

  async read(bucket: string, objectKey: string): Promise<Buffer> {
    return fs.readFile(this.resolvePath(bucket, objectKey));
  }

  getSignedUrl(bucket: string, objectKey: string, expiresInSeconds: number): string {
    const payload: SignedUrlPayload = { bucket, objectKey };
    return jwt.sign(payload, this.signingSecret, { expiresIn: expiresInSeconds });
  }

  verifySignedToken(token: string): { bucket: string; objectKey: string } {
    const decoded = jwt.verify(token, this.signingSecret) as SignedUrlPayload;
    return { bucket: decoded.bucket, objectKey: decoded.objectKey };
  }
}
