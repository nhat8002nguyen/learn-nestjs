import { Injectable } from '@nestjs/common';
import { SessionService } from '../services/session.service';

@Injectable()
export class SessionCleanupTask {
  constructor(private readonly sessionService: SessionService) {}

  async handleExpiredSessions() {
    const deletedCount = await this.sessionService.deleteExpiredSessions();
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired sessions`);
    }
    return deletedCount;
  }
}

