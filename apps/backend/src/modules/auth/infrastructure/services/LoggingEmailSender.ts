import { logger } from '../../../../shared/logging/logger';
import { IEmailSender } from '../../application/services/IEmailSender';

/**
 * docs/06-tasks/task-011.md Required Existing Code note: "if SMTP is not
 * yet available, this task's email-sending step should be stubbed behind a
 * documented interface, not skipped silently." No SMTP client library has
 * been approved/added to package.json yet (docs/04-ai-contract/01-global-rules.md
 * GLOBAL rule: no new library without explicit approval), so this
 * implementation logs the message instead of transmitting it. Swap the
 * IEmailSender binding for a real SMTP-backed implementation once an SMTP
 * library is approved.
 */
export class LoggingEmailSender implements IEmailSender {
  async send(to: string, subject: string, body: string): Promise<void> {
    logger.info('Email dispatch (logged, SMTP client not yet approved)', {
      module: 'email',
      to,
      subject,
      body,
    });
  }
}
