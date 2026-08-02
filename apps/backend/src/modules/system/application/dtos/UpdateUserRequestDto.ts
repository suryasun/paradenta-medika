import { IsEmail, MaxLength } from 'class-validator';

/**
 * task-016.md Backend Scope: "update profile fields". The Phase 1 `users`
 * table (task-003) only has username/email/status/lastLoginAt -- email is
 * the only sensible mutable profile field; username is treated as
 * immutable (not documented as updatable anywhere in the SAD).
 */
export class UpdateUserRequestDto {
  @IsEmail()
  @MaxLength(100)
  email!: string;
}
