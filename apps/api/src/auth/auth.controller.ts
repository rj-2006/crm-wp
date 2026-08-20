import { Body, Controller, Post } from '@nestjs/common'; import { AuthService } from './auth.service';
@Controller('auth') export class AuthController { constructor(private s: AuthService) { } @Post('register') register(@Body() b: any) { return this.s.register(b) } @Post('login') login(@Body() b: any) { return this.s.login(b) } }
