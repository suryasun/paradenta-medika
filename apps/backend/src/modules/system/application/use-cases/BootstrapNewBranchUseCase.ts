import { Account } from '@prisma/client';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { ISystemParameterRepository } from '../../domain/repositories/ISystemParameterRepository';
import { IWarehouseLocationRepository } from '../../../warehouse/domain/repositories/IWarehouseLocationRepository';
import { IAccountRepository } from '../../../finance/domain/repositories/IAccountRepository';
import { BranchCreatedPayload } from '../../../master-data/domain/events/MasterDataEvents';

const BOOTSTRAP_ACTOR = 'system:branch-bootstrap';
/** No literal default-warehouse-code spec exists; "MAIN" matches WarehouseLocation.locationType's own schema default. */
const DEFAULT_WAREHOUSE_LOCATION_CODE = 'MAIN';

/**
 * docs/06-tasks/task-224.md: event consumer on BranchCreated (published by
 * Branch's CRUD wiring per MOD-018, see master-data.routes.ts's onCreated
 * hook). Provisions the cross-module defaults a new branch needs. Reads/
 * writes each owning module's own repository interface -- a sanctioned
 * cross-module channel per docs/04-ai-contract/07-module-contract.md
 * MOD-003 -- rather than a direct cross-schema join.
 *
 * Idempotent per branchId: every step checks for an existing record
 * (by branch+code) before creating one, so redelivering the same event is
 * a safe no-op.
 */
export class BootstrapNewBranchUseCase {
  constructor(
    private readonly warehouseLocationRepository: IWarehouseLocationRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly systemParameterRepository: ISystemParameterRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(payload: BranchCreatedPayload): Promise<void> {
    const auditContext: AuditContext = { userId: BOOTSTRAP_ACTOR, correlationId: payload.branchId };

    await this.bootstrapWarehouseLocation(payload.branchId, payload.branchCode, auditContext);
    await this.bootstrapChartOfAccounts(payload.branchId, auditContext);
    await this.bootstrapSystemParameters(payload.branchId, auditContext);
  }

  private async bootstrapWarehouseLocation(branchId: string, branchCode: string, auditContext: AuditContext): Promise<void> {
    const existing = await this.warehouseLocationRepository.findByBranchAndCode(branchId, DEFAULT_WAREHOUSE_LOCATION_CODE);
    if (existing) {
      return;
    }

    const location = await this.warehouseLocationRepository.create({
      branchId,
      locationCode: DEFAULT_WAREHOUSE_LOCATION_CODE,
      locationName: `${branchCode} Main Warehouse`,
      locationType: 'MAIN',
      createdBy: BOOTSTRAP_ACTOR,
    });

    await this.auditService.record(
      'WarehouseLocation',
      location.id,
      'CREATE',
      null,
      { branchId, bootstrap: true },
      auditContext,
    );
  }

  private async bootstrapChartOfAccounts(branchId: string, auditContext: AuditContext): Promise<void> {
    const templateAccounts = await this.accountRepository.listTemplateAccounts();
    const templateById = new Map(templateAccounts.map((account) => [account.id, account]));
    const resolvedBranchAccountId = new Map<string, string>();

    const resolve = async (templateAccount: Account): Promise<string> => {
      const alreadyResolved = resolvedBranchAccountId.get(templateAccount.id);
      if (alreadyResolved) {
        return alreadyResolved;
      }

      const existing = await this.accountRepository.findByBranchAndCode(branchId, templateAccount.code);
      if (existing) {
        resolvedBranchAccountId.set(templateAccount.id, existing.id);
        return existing.id;
      }

      let parentBranchAccountId: string | null = null;
      if (templateAccount.parentId) {
        const parentTemplate = templateById.get(templateAccount.parentId);
        if (parentTemplate) {
          parentBranchAccountId = await resolve(parentTemplate);
        }
      }

      const account = await this.accountRepository.create({
        branchId,
        code: templateAccount.code,
        name: templateAccount.name,
        accountType: templateAccount.accountType,
        normalBalance: templateAccount.normalBalance,
        parentId: parentBranchAccountId,
        isPostable: templateAccount.isPostable,
        createdBy: BOOTSTRAP_ACTOR,
      });
      resolvedBranchAccountId.set(templateAccount.id, account.id);

      await this.auditService.record(
        'Account',
        account.id,
        'CREATE',
        null,
        { branchId, bootstrap: true, code: templateAccount.code },
        auditContext,
      );

      return account.id;
    };

    for (const templateAccount of templateAccounts) {
      await resolve(templateAccount);
    }
  }

  private async bootstrapSystemParameters(branchId: string, auditContext: AuditContext): Promise<void> {
    const globalParameters = await this.systemParameterRepository.listLatestByScope('GLOBAL');
    for (const parameter of globalParameters) {
      const existing = await this.systemParameterRepository.findLatest(parameter.key, 'BRANCH', branchId);
      if (existing) {
        continue;
      }

      const created = await this.systemParameterRepository.create({
        key: parameter.key,
        scopeType: 'BRANCH',
        scopeId: branchId,
        valueType: parameter.valueType,
        value: parameter.value,
        createdBy: BOOTSTRAP_ACTOR,
      });

      await this.auditService.record(
        'SystemParameter',
        created.id,
        'CREATE',
        null,
        { branchId, bootstrap: true, key: parameter.key },
        auditContext,
      );
    }
  }
}
