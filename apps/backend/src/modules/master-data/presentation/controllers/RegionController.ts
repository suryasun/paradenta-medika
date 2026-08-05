import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { ListProvincesUseCase } from '../../application/use-cases/ListProvincesUseCase';
import { ListRegenciesUseCase } from '../../application/use-cases/ListRegenciesUseCase';
import { ListDistrictsUseCase } from '../../application/use-cases/ListDistrictsUseCase';
import { ListVillagesUseCase } from '../../application/use-cases/ListVillagesUseCase';
import { ListDistrictsQueryDto, ListRegenciesQueryDto, ListVillagesQueryDto } from '../../application/dtos/RegionQueryDto';

// task-285 (Epic PE2): read-only, no Create/Update/Delete controller
// methods -- see the task's own Backend Scope.
export class RegionController {
  constructor(
    private readonly listProvincesUseCase: ListProvincesUseCase,
    private readonly listRegenciesUseCase: ListRegenciesUseCase,
    private readonly listDistrictsUseCase: ListDistrictsUseCase,
    private readonly listVillagesUseCase: ListVillagesUseCase,
  ) {}

  provinces = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.listProvincesUseCase.execute();
      sendSuccess(res, items, 'Provinces retrieved');
    } catch (error) {
      next(error);
    }
  };

  regencies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListRegenciesQueryDto;
      const items = await this.listRegenciesUseCase.execute(query.provinceId);
      sendSuccess(res, items, 'Regencies retrieved');
    } catch (error) {
      next(error);
    }
  };

  districts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListDistrictsQueryDto;
      const items = await this.listDistrictsUseCase.execute(query.regencyId);
      sendSuccess(res, items, 'Districts retrieved');
    } catch (error) {
      next(error);
    }
  };

  villages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListVillagesQueryDto;
      const items = await this.listVillagesUseCase.execute(query.districtId);
      sendSuccess(res, items, 'Villages retrieved');
    } catch (error) {
      next(error);
    }
  };
}
