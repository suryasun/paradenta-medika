import jwt from 'jsonwebtoken';
import { ConfigService } from '../../../../shared/config/ConfigService';

/**
 * docs/03-sad/10-authentication.md Section 11.4/11.5: HS256, issuer
 * "Parakita API", audience "Parakita Client", claims sub/username/role/
 * sessionId/clinicId/iat/exp.
 *
 * clinicId is emitted as null for Phase 1: task-003's schema has no
 * user-branch/user-clinic relation (branch assignment is explicitly owned by
 * Phase 4 per docs/06-tasks/phase-4-plan.md), so there is nothing to
 * populate it with yet.
 */
export interface AccessTokenClaims {
  sub: string;
  username: string;
  role: string;
  sessionId: string;
  clinicId: string | null;
}

export interface DecodedAccessToken extends AccessTokenClaims {
  iat: number;
  exp: number;
}

const ISSUER = 'Parakita API';
const AUDIENCE = 'Parakita Client';

export class JwtService {
  constructor(private readonly config: ConfigService) {}

  signAccessToken(claims: AccessTokenClaims): string {
    const options: jwt.SignOptions = {
      algorithm: 'HS256',
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresIn: this.config.get('jwtAccessExpiry') as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign(claims, this.config.get('jwtSecret'), options);
  }

  verifyAccessToken(token: string): DecodedAccessToken {
    return jwt.verify(token, this.config.get('jwtSecret'), {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as DecodedAccessToken;
  }
}
