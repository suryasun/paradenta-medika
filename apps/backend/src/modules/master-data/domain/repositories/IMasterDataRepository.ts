import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface IMasterDataRepository<T, TCreate, TUpdate> {
  create(input: TCreate): Promise<T>;
  list(query: ListQueryDto): Promise<PagedResult<T>>;
  findById(id: string): Promise<T | null>;
  update(id: string, input: TUpdate): Promise<T>;
}
