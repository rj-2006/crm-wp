import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import type { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const authData = await this.authService.login(dto.email, dto.password);
    
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('crm_token', authData.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax', // Must be 'none' for cross-subdomain Railway apps
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return authData;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    const isProd = process.env.NODE_ENV === 'production';

    res.clearCookie('crm_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });
    return { message: 'Logged out successfully' };
  }
}
