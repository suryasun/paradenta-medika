import { Router } from 'express';
import http from 'node:http';
import https from 'node:https';
import { prisma } from '../infrastructure/prisma';
import { ConfigService } from '../config/ConfigService';
import { sendSuccess, sendError } from './ApiResponse';

/**
 * docs/03-sad/02-system-architecture.md Section 36.2: GET /health,
 * GET /health/database, GET /health/storage.
 */
export function buildHealthRouter(config: ConfigService): Router {
  const router = Router();

  router.get('/health', (req, res) => {
    sendSuccess(res, { status: 'ok' }, 'Service is healthy');
  });

  router.get('/health/database', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      sendSuccess(res, { status: 'ok' }, 'Database connection is healthy');
    } catch {
      sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Database connection failed', [], req.correlationId);
    }
  });

  router.get('/health/storage', (req, res) => {
    const endpoint = config.get('s3Endpoint');
    const client = endpoint.startsWith('https') ? https : http;
    const request = client.get(endpoint, { timeout: 3000 }, (storageRes) => {
      storageRes.resume();
      sendSuccess(res, { status: 'ok', endpoint }, 'Storage endpoint is reachable');
    });
    request.on('timeout', () => {
      request.destroy();
      sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Storage endpoint timed out', [], req.correlationId);
    });
    request.on('error', () => {
      sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Storage endpoint unreachable', [], req.correlationId);
    });
  });

  return router;
}
