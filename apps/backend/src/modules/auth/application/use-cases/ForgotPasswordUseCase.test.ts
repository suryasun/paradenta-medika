import { ForgotPasswordUseCase } from './ForgotPasswordUseCase';
import { FakePasswordResetTokenRepository, FakeUserRepository, buildUser } from '../../../../../tests/fakes/authFakes';
import { IEmailSender } from '../services/IEmailSender';

class FakeEmailSender implements IEmailSender {
  sent: Array<{ to: string; subject: string; body: string }> = [];
  async send(to: string, subject: string, body: string): Promise<void> {
    this.sent.push({ to, subject, body });
  }
}

describe('ForgotPasswordUseCase', () => {
  it('creates a reset token and sends an email for an existing user', async () => {
    const userRepository = new FakeUserRepository();
    const tokenRepository = new FakePasswordResetTokenRepository();
    const emailSender = new FakeEmailSender();
    const user = buildUser({ email: 'jdoe@example.com' });
    userRepository.seed(user);
    const useCase = new ForgotPasswordUseCase(userRepository, tokenRepository, emailSender);

    await useCase.execute({ identifier: 'jdoe@example.com' });

    expect(tokenRepository.tokens.size).toBe(1);
    expect(emailSender.sent).toHaveLength(1);
    expect(emailSender.sent[0].to).toBe('jdoe@example.com');
  });

  it('resolves without creating a token or sending an email for a non-existing identifier, and does not throw', async () => {
    const userRepository = new FakeUserRepository();
    const tokenRepository = new FakePasswordResetTokenRepository();
    const emailSender = new FakeEmailSender();
    const useCase = new ForgotPasswordUseCase(userRepository, tokenRepository, emailSender);

    await expect(useCase.execute({ identifier: 'nobody@example.com' })).resolves.toBeUndefined();
    expect(tokenRepository.tokens.size).toBe(0);
    expect(emailSender.sent).toHaveLength(0);
  });
});
