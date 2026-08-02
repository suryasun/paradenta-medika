import express from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../../src/shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../src/shared/http/errorHandler';
import { ValidationException, NotFoundException } from '../../src/shared/http/exceptions';

function buildTestApp(routeHandler: express.RequestHandler): express.Express {
  const app = express();
  app.use(correlationIdMiddleware);
  app.get('/trigger', routeHandler);
  app.use(errorHandlerMiddleware);
  return app;
}

describe('errorHandlerMiddleware', () => {
  it('maps a raw, unexpected Error to a 500 standard envelope without leaking the stack trace', async () => {
    const app = buildTestApp(() => {
      throw new Error('password=hunter2; SELECT * FROM users WHERE 1=1');
    });

    const response = await request(app).get('/trigger');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      errors: [],
      correlationId: expect.any(String),
    });
    expect(JSON.stringify(response.body)).not.toContain('hunter2');
    expect(JSON.stringify(response.body)).not.toContain('SELECT');
  });

  it('maps ValidationException to a 400 response with field errors', async () => {
    const app = buildTestApp(() => {
      throw new ValidationException([{ field: 'patientName', message: 'is required' }]);
    });

    const response = await request(app).get('/trigger');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      code: 'VALIDATION_ERROR',
      errors: [{ field: 'patientName', message: 'is required' }],
    });
  });

  it('maps NotFoundException to a 404 response', async () => {
    const app = buildTestApp(() => {
      throw new NotFoundException('Patient not found');
    });

    const response = await request(app).get('/trigger');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, code: 'NOT_FOUND', message: 'Patient not found' });
  });
});
