import { buildCrudUseCases } from './crudUseCaseFactory';
import { IMasterDataRepository } from '../../domain/repositories/IMasterDataRepository';
import { MasterDataNotFoundException } from '../../domain/exceptions/MasterDataExceptions';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

interface Widget {
  id: string;
  code: string;
  name: string;
}

class FakeWidgetRepository implements IMasterDataRepository<Widget, { code: string; name: string }, { name?: string }> {
  widgets = new Map<string, Widget>();
  private counter = 0;

  async create(input: { code: string; name: string }): Promise<Widget> {
    this.counter += 1;
    const widget: Widget = { id: `widget-${this.counter}`, code: input.code, name: input.name };
    this.widgets.set(widget.id, widget);
    return widget;
  }

  async list(query: ListQueryDto): Promise<{ items: Widget[]; total: number }> {
    const all = [...this.widgets.values()];
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<Widget | null> {
    return this.widgets.get(id) ?? null;
  }

  async update(id: string, input: { name?: string }): Promise<Widget> {
    const widget = this.widgets.get(id);
    if (!widget) throw new Error('not found');
    if (input.name) widget.name = input.name;
    return widget;
  }
}

function defaultQuery(overrides: Partial<ListQueryDto> = {}): ListQueryDto {
  return { page: 1, limit: 20, sort: 'createdAt', order: 'desc', ...overrides };
}

describe('buildCrudUseCases (generic Master Data factory)', () => {
  it('creates an entity and records an audit CREATE entry', async () => {
    const repository = new FakeWidgetRepository();
    const auditService = new FakeAuditService();
    const useCases = buildCrudUseCases('Widget', repository, auditService);

    const widget = await useCases.create({ code: 'W1', name: 'Widget One' }, { actorUserId: 'admin-1' });

    expect(widget.code).toBe('W1');
    expect(auditService.records).toEqual([expect.objectContaining({ entity: 'Widget', entityId: widget.id, action: 'CREATE' })]);
  });

  it('runs the validateCreate hook before creating, and aborts on failure', async () => {
    const repository = new FakeWidgetRepository();
    const auditService = new FakeAuditService();
    const useCases = buildCrudUseCases('Widget', repository, auditService, {
      validateCreate: async () => {
        throw new Error('duplicate code');
      },
    });

    await expect(useCases.create({ code: 'W1', name: 'Widget One' }, { actorUserId: 'admin-1' })).rejects.toThrow(
      'duplicate code',
    );
    expect(repository.widgets.size).toBe(0);
  });

  it('lists paginated results', async () => {
    const repository = new FakeWidgetRepository();
    const auditService = new FakeAuditService();
    const useCases = buildCrudUseCases('Widget', repository, auditService);
    await useCases.create({ code: 'W1', name: 'A' }, { actorUserId: 'admin-1' });
    await useCases.create({ code: 'W2', name: 'B' }, { actorUserId: 'admin-1' });

    const { items, total } = await useCases.list(defaultQuery({ limit: 1 }));

    expect(items).toHaveLength(1);
    expect(total).toBe(2);
  });

  it('throws MasterDataNotFoundException for a missing entity on get', async () => {
    const repository = new FakeWidgetRepository();
    const auditService = new FakeAuditService();
    const useCases = buildCrudUseCases('Widget', repository, auditService);

    await expect(useCases.get('missing')).rejects.toBeInstanceOf(MasterDataNotFoundException);
  });

  it('throws MasterDataNotFoundException when updating a missing entity, before running validateUpdate', async () => {
    const repository = new FakeWidgetRepository();
    const auditService = new FakeAuditService();
    const validateUpdate = jest.fn();
    const useCases = buildCrudUseCases('Widget', repository, auditService, { validateUpdate });

    await expect(useCases.update('missing', { name: 'x' }, { actorUserId: 'admin-1' })).rejects.toBeInstanceOf(
      MasterDataNotFoundException,
    );
    expect(validateUpdate).not.toHaveBeenCalled();
  });

  it('updates an existing entity and records an audit UPDATE entry', async () => {
    const repository = new FakeWidgetRepository();
    const auditService = new FakeAuditService();
    const useCases = buildCrudUseCases('Widget', repository, auditService);
    const widget = await useCases.create({ code: 'W1', name: 'A' }, { actorUserId: 'admin-1' });

    const updated = await useCases.update(widget.id, { name: 'B' }, { actorUserId: 'admin-1' });

    expect(updated.name).toBe('B');
    expect(auditService.records.filter((r) => r.action === 'UPDATE')).toHaveLength(1);
  });
});
