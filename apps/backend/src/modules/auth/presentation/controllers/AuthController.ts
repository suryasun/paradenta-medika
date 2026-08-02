import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { LoginRequestDto } from '../../application/dtos/LoginRequestDto';
import { RefreshTokenRequestDto } from '../../application/dtos/RefreshTokenRequestDto';
import { ChangePasswordRequestDto } from '../../application/dtos/ChangePasswordRequestDto';
import { ForgotPasswordRequestDto } from '../../application/dtos/ForgotPasswordRequestDto';
import { ResetPasswordRequestDto } from '../../application/dtos/ResetPasswordRequestDto';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '../../application/use-cases/LogoutUseCase';
import { ChangePasswordUseCase } from '../../application/use-cases/ChangePasswordUseCase';
import { ForgotPasswordUseCase } from '../../application/use-cases/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../application/use-cases/ResetPasswordUseCase';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as LoginRequestDto;
      const result = await this.loginUseCase.execute({
        identifier: body.identifier,
        password: body.password,
        deviceId: body.deviceId,
        deviceName: body.deviceName,
        deviceType: body.deviceType,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as RefreshTokenRequestDto;
      const result = await this.refreshTokenUseCase.execute({
        refreshToken: body.refreshToken,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, result, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) {
        throw new AuthenticationException();
      }
      await this.logoutUseCase.execute({
        sessionId: req.auth.sessionId,
        userId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) {
        throw new AuthenticationException();
      }
      const body = req.body as ChangePasswordRequestDto;
      await this.changePasswordUseCase.execute({
        userId: req.auth.userId,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as ForgotPasswordRequestDto;
      await this.forgotPasswordUseCase.execute({ identifier: body.identifier });
      sendSuccess(res, null, 'If this account exists, a password reset link has been sent');
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as ResetPasswordRequestDto;
      await this.resetPasswordUseCase.execute({
        token: body.token,
        newPassword: body.newPassword,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, null, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  };
}
