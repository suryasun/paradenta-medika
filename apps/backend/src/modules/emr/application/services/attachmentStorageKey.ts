import { createHash } from 'crypto';
import { randomUUID } from 'crypto';
import path from 'path';

export interface PreparedUploadFile {
  storedName: string;
  extension: string;
  objectKey: string;
  checksum: string;
}

/**
 * docs/03-sad/15-module-emr.md Part 3.3A Section 8 "Folder Structure":
 * attachments/patient/{patientId}/visit/{visitId}/{category}/{storedName}.
 * `checksum` is SHA256 of the file bytes, per Section 7's Metadata
 * Structure table.
 */
export function prepareUploadFile(
  patientId: string,
  visitId: string,
  category: string,
  originalFileName: string,
  buffer: Buffer,
): PreparedUploadFile {
  const extension = path.extname(originalFileName).replace('.', '').toLowerCase();
  const storedName = `${randomUUID()}${extension ? `.${extension}` : ''}`;
  const objectKey = `patient/${patientId}/visit/${visitId}/${category.toLowerCase()}/${storedName}`;
  const checksum = createHash('sha256').update(buffer).digest('hex');
  return { storedName, extension, objectKey, checksum };
}
