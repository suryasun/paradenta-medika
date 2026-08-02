import { NextFunction, Request, Response } from 'express';
import { IObjectStorageService } from '../../../../shared/storage/IObjectStorageService';

/**
 * docs/06-tasks/task-080.md: serves the raw bytes for a signed download
 * URL. Deliberately NOT behind the authenticate/requirePermission chain --
 * the signed token itself is the credential, mirroring how a real S3/MinIO
 * presigned URL works (anyone holding the URL can use it until it expires,
 * no separate bearer-token check).
 */
export class AttachmentFileController {
  constructor(private readonly objectStorage: IObjectStorageService) {}

  serve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bucket, objectKey } = this.objectStorage.verifySignedToken(req.params.token);
      const data = await this.objectStorage.read(bucket, objectKey);
      res.setHeader('Cache-Control', 'private, max-age=0, no-store');
      res.send(data);
    } catch (error) {
      next(error);
    }
  };
}
