/**
 * Structured JSON logger per docs/03-sad/03-clean-architecture.md Section 36.5.
 * The exact log collector/transport is NOT DEFINED IN SAD; stdout JSON lines
 * are used so any collector can be attached later without code changes.
 */
export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogFields {
  correlationId?: string;
  userId?: string;
  module?: string;
  action?: string;
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, fields: LogFields = {}): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === 'ERROR' || level === 'FATAL') {
    // eslint-disable-next-line no-console
    console.error(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export const logger = {
  trace: (message: string, fields?: LogFields) => write('TRACE', message, fields),
  debug: (message: string, fields?: LogFields) => write('DEBUG', message, fields),
  info: (message: string, fields?: LogFields) => write('INFO', message, fields),
  warn: (message: string, fields?: LogFields) => write('WARN', message, fields),
  error: (message: string, fields?: LogFields) => write('ERROR', message, fields),
  fatal: (message: string, fields?: LogFields) => write('FATAL', message, fields),
};
