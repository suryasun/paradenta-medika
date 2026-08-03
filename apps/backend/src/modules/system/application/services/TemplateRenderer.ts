import { NotificationChannel } from '@prisma/client';
import { TemplateContentUnsafeException, TemplateVariableMissingException } from '../../domain/exceptions/SystemExceptions';

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
const UNSAFE_PATTERNS = [/<script/i, /javascript:/i, /on\w+\s*=/i];

/** Channels whose rendered output is displayed as markup and therefore needs HTML-escaped variable substitution to prevent injected content from executing. */
const HTML_ESCAPED_CHANNELS: NotificationChannel[] = ['EMAIL', 'IN_APP'];

function htmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function extractVariables(text: string): string[] {
  return [...text.matchAll(VARIABLE_PATTERN)].map((match) => match[1]);
}

/**
 * docs/03-sad/21-module-system.md UC-SYS-005 step 2: "System validates
 * variables/escaping and blocks unsafe content according to channel
 * policy." Used identically by Create (task-195), Preview (task-196),
 * and Send (task-199) so the three can never diverge in what they
 * consider safe.
 */
export class TemplateRenderer {
  /** Rejects a template whose body/subject references a variable outside its own declared schema, or contains an unsafe content pattern. Called at Create time. */
  assertTemplateWellFormed(body: string, subject: string | undefined, variableSchema: string[]): void {
    for (const pattern of UNSAFE_PATTERNS) {
      if (pattern.test(body) || (subject && pattern.test(subject))) {
        throw new TemplateContentUnsafeException(`content matches disallowed pattern ${pattern}`);
      }
    }
    const referenced = new Set([...extractVariables(body), ...(subject ? extractVariables(subject) : [])]);
    const undeclared = [...referenced].filter((name) => !variableSchema.includes(name));
    if (undeclared.length > 0) {
      throw new TemplateContentUnsafeException(`references undeclared variable(s): ${undeclared.join(', ')}`);
    }
  }

  /** Renders body/subject against `payload`, HTML-escaping values for markup channels. Called by Preview and Send -- payload must satisfy every variable in the template's declared schema. */
  render(
    body: string,
    subject: string | undefined,
    variableSchema: string[],
    payload: Record<string, unknown>,
    channel: NotificationChannel,
  ): { body: string; subject?: string } {
    const missing = variableSchema.filter((name) => !(name in payload));
    if (missing.length > 0) {
      throw new TemplateVariableMissingException(missing);
    }

    const escape = HTML_ESCAPED_CHANNELS.includes(channel) ? htmlEscape : (value: string) => value;
    const substitute = (text: string) =>
      text.replace(VARIABLE_PATTERN, (_match, name: string) => {
        const value = payload[name];
        return escape(value === null || value === undefined ? '' : String(value));
      });

    return { body: substitute(body), subject: subject ? substitute(subject) : undefined };
  }
}
