import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'STAFF' | 'ADMIN';
  companyId: string;
}

const cookieExtractor = (req: Request) => {
  if (req && req.cookies) {
    return req.cookies['crm_token'] || null;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'changeme'),
    });
  }

  async validate(payload: JwtPayload) {
    // Attached to req.user — kept minimal on purpose; controllers that need
    // fresh DB state (e.g. role changed mid-session) should re-fetch by sub.
    return payload;
  }
}
