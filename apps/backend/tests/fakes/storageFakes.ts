import { IObjectStorageService, StoredObject } from '../../src/shared/storage/IObjectStorageService';

export class FakeObjectStorageService implements IObjectStorageService {
  objects = new Map<string, Buffer>();
  signedUrls = new Map<string, { bucket: string; objectKey: string; expiresAt: number }>();
  private tokenCounter = 0;

  private key(bucket: string, objectKey: string): string {
    return `${bucket}/${objectKey}`;
  }

  async put(bucket: string, objectKey: string, data: Buffer): Promise<StoredObject> {
    this.objects.set(this.key(bucket, objectKey), data);
    return { bucket, objectKey, fileSize: data.length };
  }

  async read(bucket: string, objectKey: string): Promise<Buffer> {
    const data = this.objects.get(this.key(bucket, objectKey));
    if (!data) throw new Error('object not found');
    return data;
  }

  getSignedUrl(bucket: string, objectKey: string, expiresInSeconds: number): string {
    this.tokenCounter += 1;
    const token = `token-${this.tokenCounter}`;
    this.signedUrls.set(token, { bucket, objectKey, expiresAt: Date.now() + expiresInSeconds * 1000 });
    return token;
  }

  verifySignedToken(token: string): { bucket: string; objectKey: string } {
    const entry = this.signedUrls.get(token);
    if (!entry) throw new Error('invalid token');
    if (entry.expiresAt < Date.now()) throw new Error('token expired');
    return { bucket: entry.bucket, objectKey: entry.objectKey };
  }
}
