import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Session } from '../entities/session.entity';
import * as crypto from 'crypto';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async createSession(
    userId: number,
    refreshToken: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Session> {
    const session = this.sessionRepository.create({
      userId,
      refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return await this.sessionRepository.save(session);
  }

  async findSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
    return await this.sessionRepository.findOne({
      where: { refreshToken },
      relations: ['user'],
    });
  }

  async deleteSession(refreshToken: string): Promise<void> {
    await this.sessionRepository.delete({ refreshToken });
  }

  async deleteAllUserSessions(userId: number): Promise<void> {
    await this.sessionRepository.delete({ userId });
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  async deleteSessionById(sessionId: number): Promise<void> {
    await this.sessionRepository.delete({ id: sessionId });
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }
}

