import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // GET ME / PROFILE

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    return req.user;
  }

  // REGISTER

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // LOGIN

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // XÁC ĐỊNH COOKIE DỰA TRÊN ROLE

    const cookieName =
      result.user.role === 'admin'
        ? 'admin_access_token'
        : 'client_access_token';

    // LƯU JWT VÀO HTTPONLY COOKIE

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(cookieName, result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    // KHÔNG TRẢ ACCESS TOKEN VỀ FRONTEND

    return {
      message: result.message,
      user: result.user,
    };
  }

  // FORGOT PASSWORD

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // RESET PASSWORD

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // LOGOUT
  // LOGOUT CLIENT

  @Post('client/logout')
  @HttpCode(HttpStatus.OK)
  logoutClient(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('client_access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Client logout successful!' };
  }

  // LOGOUT ADMIN

  @Post('admin/logout')
  @HttpCode(HttpStatus.OK)
  logoutAdmin(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('admin_access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Admin logout successful!' };
  }
}
