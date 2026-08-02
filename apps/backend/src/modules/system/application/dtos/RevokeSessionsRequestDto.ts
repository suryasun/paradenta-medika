import { IsOptional, IsUUID } from 'class-validator';

/**
 * docs/04-ai-contract/05-auth-contract.md AUTH-049: revoke all devices, a
 * selected device, or all sessions. `sessionId` omitted means "all devices".
 */
export class RevokeSessionsRequestDto {
  @IsOptional()
  @IsUUID('4')
  sessionId?: string;
}
