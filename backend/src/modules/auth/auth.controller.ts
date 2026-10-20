import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { loginSchema, registerSchema, verifySchema } from '@campusfind/contracts';
import { parse } from '../../common/http';
import { AuthRequest, Public, SESSION_COOKIE } from '../../common/session';
import { readConfig } from '../../config';
import { AuthService, publicUser } from './auth.service';
@Controller()
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  @Public()
  @Post('auth/register')
  @HttpCode(202)
  async register(@Body() body: unknown) {
    return { data: await this.auth.register(parse(registerSchema, body)) };
  }
  @Public()
  @Post('auth/verify-email')
  @HttpCode(200)
  async verify(@Body() body: unknown) {
    return { data: await this.auth.verify(parse(verifySchema, body).token) };
  }
  @Public()
  @Post('auth/login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(parse(loginSchema, body));
    res.cookie(SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: readConfig().production,
      path: '/',
      expires: result.expiresAt,
    });
    return { data: { user: result.user } };
  }
  @Post('auth/logout')
  @HttpCode(200)
  async logout(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.logout(req.sessionHash);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { data: result };
  }
  @Get('users/me') me(@Req() req: AuthRequest) {
    return { data: publicUser(req.user) };
  }
}
