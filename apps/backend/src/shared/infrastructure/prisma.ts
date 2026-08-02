import { PrismaClient } from '@prisma/client';

/**
 * Single shared Prisma client per docs/04-ai-contract/06-database-contract.md
 * DB-003/DB-004: database access MUST occur only through the Repository
 * layer via this client, never directly from controllers or business logic.
 */
export const prisma = new PrismaClient();
