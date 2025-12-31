import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { SessionService } from './services/session.service';
import { User } from '../users/entities/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.usersService.validatePassword(user, password);
    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return user;
  }

  async findById(id: number): Promise<User | null> {
    return await this.usersService.findById(id);
  }

  async login(user: User, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.sessionService.generateRefreshToken();

    const accessTokenExpiresIn = this.configService.get<number>('JWT_EXPIRES_IN', 3600);
    const refreshTokenExpiresIn = this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN', 604800);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + refreshTokenExpiresIn);

    await this.sessionService.createSession(
      user.id,
      refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiresIn,
    };
  }

  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ): Promise<User> {
    return await this.usersService.create(email, password, firstName, lastName);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const session = await this.sessionService.findSessionByRefreshToken(refreshToken);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      await this.sessionService.deleteSession(refreshToken);
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = session.user;
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.sessionService.deleteSession(refreshToken);

    return await this.login(user, session.ipAddress, session.userAgent);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessionService.deleteSession(refreshToken);
  }

  async logoutAll(userId: number): Promise<void> {
    await this.sessionService.deleteAllUserSessions(userId);
  }
}

