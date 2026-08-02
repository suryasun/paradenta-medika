import { ConflictException, NotFoundException } from '../../../../shared/http/exceptions';

export class MasterDataNotFoundException extends NotFoundException {
  constructor(entityName: string) {
    super(`${entityName} not found`);
  }
}

export class MasterDataCodeExistsException extends ConflictException {
  constructor(entityName: string) {
    super(`${entityName} code already exists`);
  }
}

export class MasterDataReferenceInvalidException extends NotFoundException {
  constructor(message: string) {
    super(message);
  }
}
