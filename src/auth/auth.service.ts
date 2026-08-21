import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  // 1. Register a new account
  async register(registerDto: RegisterDto) {
    const { name, email, password, confirmPassword } = registerDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match!');
    }

    const newUser = await this.usersService.create({
      name,
      email,
      password,
    });

    return {
      message: 'Account registered successfully!',
      userId: newUser._id,
    };
  }

  // 2. Validate login credentials
  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isBlocked) {
      throw new ForbiddenException(
        'Your account has been blocked due to a violation of our policies!',
      );
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  // 3. Login and create JWT token
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      access_token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  // 4. Forgot password request
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('No account exists with this email address!');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpires;
    await user.save();

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h3>Reset Your Account Password</h3>
        <p>You have requested to reset your password. Please click the link below to complete the process:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>Your reset token: <b>${resetToken}</b></p>
        <p><i>This link will expire in 15 minutes.</i></p>
      `,
    });

    return {
      message: 'Password reset instructions have been sent to your email!',
    };
  }

  // 5. Reset password using Token
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.usersService.findByResetToken(token);

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException(
        'The reset token is invalid or has expired!',
      );
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return {
      message: 'Password reset successfully! You can now log in.',
    };
  }

  async logout(userId: string) {
    return { message: 'Logout successful!' };
  }
}
