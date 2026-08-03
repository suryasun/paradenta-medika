import { CreateNotificationTemplateUseCase } from './CreateNotificationTemplateUseCase';
import { PreviewNotificationTemplateUseCase } from './PreviewNotificationTemplateUseCase';
import { ListNotificationsUseCase } from './ListNotificationsUseCase';
import { MarkNotificationReadUseCase } from './MarkNotificationReadUseCase';
import { SendNotificationUseCase } from './SendNotificationUseCase';
import { TemplateRenderer } from '../services/TemplateRenderer';
import {
  NotificationNotOwnedException,
  NotificationTemplateNotFoundException,
  TemplateContentUnsafeException,
  TemplateVariableMissingException,
} from '../../domain/exceptions/SystemExceptions';
import {
  FakeNotificationProviderAdapter,
  FakeNotificationRepository,
  FakeNotificationTemplateRepository,
} from '../../../../../tests/fakes/systemFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { InMemoryEventBus } from '../../../../shared/events/EventBus';

function baseQuery() {
  return { page: 1, limit: 20, sort: 'createdAt', order: 'desc' as const };
}

function buildSut() {
  const templateRepository = new FakeNotificationTemplateRepository();
  const notificationRepository = new FakeNotificationRepository();
  const providerAdapter = new FakeNotificationProviderAdapter();
  const auditService = new FakeAuditService();
  const templateRenderer = new TemplateRenderer();
  const eventBus = new InMemoryEventBus();

  return {
    templateRepository,
    notificationRepository,
    providerAdapter,
    auditService,
    eventBus,
    createTemplateUseCase: new CreateNotificationTemplateUseCase(templateRepository, templateRenderer, auditService),
    previewUseCase: new PreviewNotificationTemplateUseCase(templateRepository, templateRenderer),
    listNotificationsUseCase: new ListNotificationsUseCase(notificationRepository),
    markReadUseCase: new MarkNotificationReadUseCase(notificationRepository),
    sendUseCase: new SendNotificationUseCase(notificationRepository, templateRepository, templateRenderer, providerAdapter, eventBus),
  };
}

describe('Notification Center (task-195-199, UC-SYS-005)', () => {
  it('creates a template and rejects unsafe content (<script tag)', async () => {
    const { createTemplateUseCase } = buildSut();
    await expect(
      createTemplateUseCase.execute(
        {
          templateKey: 'reservation.reminder',
          channel: 'EMAIL',
          locale: 'id-ID',
          body: '<script>alert(1)</script>',
          variableSchema: [],
        },
        'admin-1',
        { userId: 'admin-1' },
      ),
    ).rejects.toBeInstanceOf(TemplateContentUnsafeException);
  });

  it('rejects a template body that references an undeclared variable', async () => {
    const { createTemplateUseCase } = buildSut();
    await expect(
      createTemplateUseCase.execute(
        {
          templateKey: 'reservation.reminder',
          channel: 'EMAIL',
          locale: 'id-ID',
          body: 'Hello {{patientName}}',
          variableSchema: [],
        },
        'admin-1',
        { userId: 'admin-1' },
      ),
    ).rejects.toBeInstanceOf(TemplateContentUnsafeException);
  });

  it('a well-formed template creates version 1, and re-creating the same key creates version 2 (immutable-after-published)', async () => {
    const { createTemplateUseCase, templateRepository } = buildSut();
    const v1 = await createTemplateUseCase.execute(
      { templateKey: 'reservation.reminder', channel: 'EMAIL', locale: 'id-ID', body: 'Hi {{patientName}}', variableSchema: ['patientName'] },
      'admin-1',
      { userId: 'admin-1' },
    );
    const v2 = await createTemplateUseCase.execute(
      { templateKey: 'reservation.reminder', channel: 'EMAIL', locale: 'id-ID', body: 'Hello {{patientName}}!', variableSchema: ['patientName'] },
      'admin-1',
      { userId: 'admin-1' },
    );
    expect(v1.version).toBe(1);
    expect(v2.version).toBe(2);
    expect(templateRepository.templates.size).toBe(2);
  });

  it('Preview renders against supplied payload without creating any Notification row (never sends for real)', async () => {
    const { createTemplateUseCase, previewUseCase, notificationRepository } = buildSut();
    const template = await createTemplateUseCase.execute(
      { templateKey: 'reservation.reminder', channel: 'EMAIL', locale: 'id-ID', body: 'Hi {{patientName}}', variableSchema: ['patientName'] },
      'admin-1',
      { userId: 'admin-1' },
    );

    const result = await previewUseCase.execute(template.id, { patientName: 'Budi' });
    expect(result.body).toBe('Hi Budi');
    expect(notificationRepository.notifications.size).toBe(0);
  });

  it('Preview HTML-escapes variables for markup channels to prevent injected content', async () => {
    const { createTemplateUseCase, previewUseCase } = buildSut();
    const template = await createTemplateUseCase.execute(
      { templateKey: 'reservation.reminder', channel: 'EMAIL', locale: 'id-ID', body: 'Hi {{patientName}}', variableSchema: ['patientName'] },
      'admin-1',
      { userId: 'admin-1' },
    );

    const result = await previewUseCase.execute(template.id, { patientName: '<b>Budi</b>' });
    expect(result.body).toBe('Hi &lt;b&gt;Budi&lt;/b&gt;');
  });

  it('Preview throws for an unknown template id', async () => {
    const { previewUseCase } = buildSut();
    await expect(previewUseCase.execute('does-not-exist', {})).rejects.toBeInstanceOf(NotificationTemplateNotFoundException);
  });

  it('SendNotificationUseCase throws when required payload variables are missing', async () => {
    const { createTemplateUseCase, sendUseCase } = buildSut();
    await createTemplateUseCase.execute(
      { templateKey: 'reservation.reminder', channel: 'EMAIL', locale: 'id-ID', body: 'Hi {{patientName}}', variableSchema: ['patientName'] },
      'admin-1',
      { userId: 'admin-1' },
    );

    await expect(
      sendUseCase.execute({ templateKey: 'reservation.reminder', recipientUserId: 'u1', payload: {}, idempotencyKey: 'k1' }),
    ).rejects.toBeInstanceOf(TemplateVariableMissingException);
  });

  it('SendNotificationUseCase delivers successfully and publishes a delivered event', async () => {
    const { createTemplateUseCase, sendUseCase, eventBus, providerAdapter } = buildSut();
    await createTemplateUseCase.execute(
      { templateKey: 'reservation.reminder', channel: 'EMAIL', locale: 'id-ID', body: 'Hi {{patientName}}', variableSchema: ['patientName'] },
      'admin-1',
      { userId: 'admin-1' },
    );
    let delivered: unknown;
    eventBus.subscribe('system.notification.delivered.v1', (payload) => {
      delivered = payload;
    });

    const notification = await sendUseCase.execute({
      templateKey: 'reservation.reminder',
      recipientUserId: 'u1',
      payload: { patientName: 'Budi' },
      idempotencyKey: 'k1',
    });

    expect(notification.status).toBe('SENT');
    expect(notification.message).toBe('Hi Budi');
    expect(providerAdapter.sent).toHaveLength(1);
    expect(delivered).toBeDefined();
  });

  it('a retried call with the same idempotencyKey does not create a duplicate delivery', async () => {
    const { createTemplateUseCase, sendUseCase, notificationRepository } = buildSut();
    await createTemplateUseCase.execute(
      { templateKey: 'reservation.reminder', channel: 'EMAIL', locale: 'id-ID', body: 'Hi {{patientName}}', variableSchema: ['patientName'] },
      'admin-1',
      { userId: 'admin-1' },
    );
    const input = { templateKey: 'reservation.reminder', recipientUserId: 'u1', payload: { patientName: 'Budi' }, idempotencyKey: 'k1' };

    const first = await sendUseCase.execute(input);
    const second = await sendUseCase.execute(input);

    expect(second.id).toBe(first.id);
    expect(notificationRepository.notifications.size).toBe(1);
  });

  it('transient failures retry idempotently and are dead-lettered (status FAILED) once max attempts is exhausted, publishing a dead-letter event', async () => {
    const { createTemplateUseCase, sendUseCase, providerAdapter, eventBus } = buildSut();
    await createTemplateUseCase.execute(
      { templateKey: 'reservation.reminder', channel: 'SMS', locale: 'id-ID', body: 'Hi {{patientName}}', variableSchema: ['patientName'] },
      'admin-1',
      { userId: 'admin-1' },
    );
    providerAdapter.shouldFail = true;
    let deadLettered: unknown;
    eventBus.subscribe('system.notification.dead-lettered.v1', (payload) => {
      deadLettered = payload;
    });

    const input = { templateKey: 'reservation.reminder', recipientUserId: 'u1', payload: { patientName: 'Budi' }, idempotencyKey: 'k2' };
    const attempt1 = await sendUseCase.execute(input);
    expect(attempt1.status).toBe('QUEUED');
    expect(attempt1.attempts).toBe(1);

    const attempt2 = await sendUseCase.execute(input);
    expect(attempt2.status).toBe('QUEUED');
    expect(attempt2.attempts).toBe(2);

    const attempt3 = await sendUseCase.execute(input);
    expect(attempt3.status).toBe('FAILED');
    expect(attempt3.attempts).toBe(3);
    expect(deadLettered).toBeDefined();

    // A further retry against an already dead-lettered notification is a no-op, not a 4th delivery attempt.
    const attempt4 = await sendUseCase.execute(input);
    expect(attempt4.attempts).toBe(3);
    expect(providerAdapter.sent).toHaveLength(3);
  });

  it('ListNotificationsUseCase scopes strictly to the requesting recipient', async () => {
    const { notificationRepository, listNotificationsUseCase } = buildSut();
    await notificationRepository.create({ recipientUserId: 'u1', channel: 'EMAIL', message: 'for u1', idempotencyKey: 'a' });
    await notificationRepository.create({ recipientUserId: 'u2', channel: 'EMAIL', message: 'for u2', idempotencyKey: 'b' });

    const result = await listNotificationsUseCase.execute(baseQuery(), 'u1');
    expect(result.total).toBe(1);
    expect(result.items[0].message).toBe('for u1');
  });

  it('MarkNotificationReadUseCase rejects marking another recipient\'s notification', async () => {
    const { notificationRepository, markReadUseCase } = buildSut();
    const notification = await notificationRepository.create({ recipientUserId: 'u1', channel: 'EMAIL', message: 'hi', idempotencyKey: 'c' });

    await expect(markReadUseCase.execute(notification.id, 'u2')).rejects.toBeInstanceOf(NotificationNotOwnedException);
  });

  it('MarkNotificationReadUseCase marks the owner\'s own notification as read', async () => {
    const { notificationRepository, markReadUseCase } = buildSut();
    const notification = await notificationRepository.create({ recipientUserId: 'u1', channel: 'EMAIL', message: 'hi', idempotencyKey: 'd' });

    const result = await markReadUseCase.execute(notification.id, 'u1');
    expect(result.status).toBe('READ');
    expect(result.readAt).not.toBeNull();
  });
});
