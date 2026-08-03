import { ApplicationException } from '../../../../shared/http/exceptions/ApplicationException';
import { AuthorizationException, BusinessException, ConflictException, NotFoundException } from '../../../../shared/http/exceptions';

/** docs/03-sad/20-module-report.md Section 6.4 literal error catalog. */
export class ReportDefinitionNotFoundException extends NotFoundException {
  constructor() {
    super('Report definition not found');
  }
}

export class ReportScopeForbiddenException extends AuthorizationException {
  constructor() {
    super('Requested branch/detail is outside the requester\'s authority', 'RPT_SCOPE_FORBIDDEN');
  }
}

export class ReportFilterInvalidException extends BusinessException {
  constructor(message = 'One or more filter/dimension/date-range values are invalid') {
    super('RPT_FILTER_INVALID', message);
  }
}

export class ReportRangeTooLargeException extends BusinessException {
  constructor() {
    super('RPT_RANGE_TOO_LARGE', 'The requested date range exceeds the synchronous/export policy limit; create an asynchronous report job instead');
  }
}

export class ReportJobDuplicateException extends ConflictException {
  constructor() {
    super('An equivalent active job already exists for this report/scope', 'RPT_JOB_DUPLICATE');
  }
}

export class ReportJobNotFoundException extends NotFoundException {
  constructor() {
    super('Report job not found');
  }
}

export class ReportJobNotReadyException extends ConflictException {
  constructor() {
    super('The report job has not completed yet', 'RPT_JOB_NOT_READY');
  }
}

export class ReportExportExpiredException extends ApplicationException {
  readonly httpStatus = 410;
  readonly code = 'RPT_EXPORT_EXPIRED';
  constructor() {
    super('This export artifact has passed its retention period');
  }
}

/** docs/03-sad/20-module-report.md Section 9: "Required source unavailable -> Job fails safely/no false complete output". Used for report codes (hr.*, system.activity-audit) whose owning source has no data/module yet. */
export class ReportDatasetUnavailableException extends ApplicationException {
  readonly httpStatus = 503;
  readonly code = 'RPT_DATASET_UNAVAILABLE';
  constructor(message = 'The required source projection/data is not available for this report yet') {
    super(message);
  }
}

export class ReportSnapshotNotFoundException extends NotFoundException {
  constructor() {
    super('Report snapshot not found');
  }
}

export class ReportSnapshotTamperedException extends ConflictException {
  constructor() {
    super('Snapshot checksum verification failed; the read is blocked and a data-quality issue has been recorded', 'RPT_SNAPSHOT_TAMPERED');
  }
}

export class ReportExportArtifactNotFoundException extends NotFoundException {
  constructor() {
    super('Export artifact not found');
  }
}
