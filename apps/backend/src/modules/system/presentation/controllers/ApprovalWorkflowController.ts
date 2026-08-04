import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { CreateSystemParameterRequestDto } from '../../application/dtos/SystemParameterRequestDto';
import { ListSystemParameterQueryDto, ListFeatureFlagQueryDto } from '../../application/dtos/ApprovalWorkflowQueryDto';
import { CreateChangeRequestDto, RollbackParameterDto } from '../../application/dtos/ConfigurationChangeRequestDto';
import { CreateFeatureFlagRequestDto, UpdateFeatureFlagRequestDto } from '../../application/dtos/FeatureFlagRequestDto';
import { CreateMenuRequestDto, UpdateMenuPermissionsRequestDto } from '../../application/dtos/MenuRequestDto';
import { CreateParameterUseCase } from '../../application/use-cases/CreateParameterUseCase';
import { ListParametersUseCase } from '../../application/use-cases/ListParametersUseCase';
import { ListParameterVersionsUseCase } from '../../application/use-cases/ListParameterVersionsUseCase';
import { CreateConfigurationChangeRequestUseCase } from '../../application/use-cases/CreateConfigurationChangeRequestUseCase';
import { ApproveConfigurationChangeRequestUseCase } from '../../application/use-cases/ApproveConfigurationChangeRequestUseCase';
import { RollbackParameterUseCase } from '../../application/use-cases/RollbackParameterUseCase';
import { CreateFeatureFlagUseCase } from '../../application/use-cases/CreateFeatureFlagUseCase';
import { ListFeatureFlagsUseCase } from '../../application/use-cases/ListFeatureFlagsUseCase';
import { UpdateFeatureFlagUseCase } from '../../application/use-cases/UpdateFeatureFlagUseCase';
import { CreateMenuUseCase } from '../../application/use-cases/CreateMenuUseCase';
import { ListMenusUseCase } from '../../application/use-cases/ListMenusUseCase';
import { UpdateMenuPermissionsUseCase } from '../../application/use-cases/UpdateMenuPermissionsUseCase';
import { GetBranchConfigurationUseCase } from '../../application/use-cases/GetBranchConfigurationUseCase';

export class ApprovalWorkflowController {
  constructor(
    private readonly createParameterUseCase: CreateParameterUseCase,
    private readonly listParametersUseCase: ListParametersUseCase,
    private readonly listParameterVersionsUseCase: ListParameterVersionsUseCase,
    private readonly createConfigurationChangeRequestUseCase: CreateConfigurationChangeRequestUseCase,
    private readonly approveConfigurationChangeRequestUseCase: ApproveConfigurationChangeRequestUseCase,
    private readonly rollbackParameterUseCase: RollbackParameterUseCase,
    private readonly createFeatureFlagUseCase: CreateFeatureFlagUseCase,
    private readonly listFeatureFlagsUseCase: ListFeatureFlagsUseCase,
    private readonly updateFeatureFlagUseCase: UpdateFeatureFlagUseCase,
    private readonly createMenuUseCase: CreateMenuUseCase,
    private readonly listMenusUseCase: ListMenusUseCase,
    private readonly updateMenuPermissionsUseCase: UpdateMenuPermissionsUseCase,
    private readonly getBranchConfigurationUseCase: GetBranchConfigurationUseCase,
  ) {}

  private auditContext(req: Request) {
    return { userId: req.auth!.userId, ipAddress: req.ip, correlationId: req.correlationId };
  }

  createParameter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parameter = await this.createParameterUseCase.execute(req.body as CreateSystemParameterRequestDto, req.auth!.userId, this.auditContext(req));
      sendSuccess(res, parameter, 'System parameter created', 201);
    } catch (error) {
      next(error);
    }
  };

  listParameters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListSystemParameterQueryDto;
      const { items, total } = await this.listParametersUseCase.execute(query);
      sendSuccess(res, items, 'System parameters retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  listParameterVersions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListQueryDto;
      const { items, total } = await this.listParameterVersionsUseCase.execute(req.params.parameterKey, query);
      sendSuccess(res, items, 'Parameter versions retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  getBranchConfiguration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entries = await this.getBranchConfigurationUseCase.execute(req.params.branchId);
      sendSuccess(res, entries, 'Branch configuration retrieved');
    } catch (error) {
      next(error);
    }
  };

  createChangeRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request = await this.createConfigurationChangeRequestUseCase.execute(
        req.params.parameterKey,
        req.body as CreateChangeRequestDto,
        req.auth!.userId,
        this.auditContext(req),
      );
      sendSuccess(res, request, 'Configuration change request created', 201);
    } catch (error) {
      next(error);
    }
  };

  approveChangeRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request = await this.approveConfigurationChangeRequestUseCase.execute(req.params.requestId, req.auth!.userId, this.auditContext(req));
      sendSuccess(res, request, 'Configuration change request approved');
    } catch (error) {
      next(error);
    }
  };

  rollbackParameter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request = await this.rollbackParameterUseCase.execute(
        req.params.parameterKey,
        req.body as RollbackParameterDto,
        req.auth!.userId,
        this.auditContext(req),
      );
      sendSuccess(res, request, 'Rollback change request created', 201);
    } catch (error) {
      next(error);
    }
  };

  createFeatureFlag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const flag = await this.createFeatureFlagUseCase.execute(req.body as CreateFeatureFlagRequestDto, req.auth!.userId, this.auditContext(req));
      sendSuccess(res, flag, 'Feature flag created', 201);
    } catch (error) {
      next(error);
    }
  };

  listFeatureFlags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListFeatureFlagQueryDto;
      const { items, total } = await this.listFeatureFlagsUseCase.execute(query);
      sendSuccess(res, items, 'Feature flags retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  updateFeatureFlag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const flag = await this.updateFeatureFlagUseCase.execute(
        req.params.flagKey,
        req.body as UpdateFeatureFlagRequestDto,
        req.auth!.userId,
        this.auditContext(req),
      );
      sendSuccess(res, flag, 'Feature flag updated');
    } catch (error) {
      next(error);
    }
  };

  createMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menu = await this.createMenuUseCase.execute(req.body as CreateMenuRequestDto, req.auth!.userId, this.auditContext(req));
      sendSuccess(res, menu, 'Menu created', 201);
    } catch (error) {
      next(error);
    }
  };

  listMenus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListQueryDto;
      const { items, total } = await this.listMenusUseCase.execute(query);
      sendSuccess(res, items, 'Menus retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  updateMenuPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menu = await this.updateMenuPermissionsUseCase.execute(
        req.params.menuId,
        req.body as UpdateMenuPermissionsRequestDto,
        req.auth!.userId,
        this.auditContext(req),
      );
      sendSuccess(res, menu, 'Menu permissions updated');
    } catch (error) {
      next(error);
    }
  };
}
