import { SoapNote } from '@prisma/client';

export interface UpsertSoapNoteInput {
  visitId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  updatedBy: string;
}

export interface ISoapNoteRepository {
  upsert(input: UpsertSoapNoteInput): Promise<SoapNote>;
  findByVisitId(visitId: string): Promise<SoapNote | null>;
}
