import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { sessionPaginationConfig } from './pagination/session.pagination';

@Injectable()
export class SessionsService {
  constructor(@InjectRepository(Session) private sessionRepository) {}

  async getSessions(query: PaginateQuery) {
    return await paginate<Session>(
      query,
      this.sessionRepository,
      sessionPaginationConfig,
    );
  }

  async getSessionById(id: number) {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
    return session;
  }

  async getSessionsByUserId(user_id: number) {
    const sessions = await this.sessionRepository.find({ where: { user_id } });
    if (!sessions) {
      throw new NotFoundException(`No sessions found for user id ${user_id}`);
    }
    return sessions;
  }

  async getMySessions(user_id: number, query: PaginateQuery) {
    const queryBuilder = this.sessionRepository.createQueryBuilder('session');
    queryBuilder
      .where('session.user_id = :user_id', { user_id })
      .andWhere('session.is_active = :is_active', { is_active: true });

    sessionPaginationConfig.relations = [];
    return await paginate<Session>(
      query,
      queryBuilder,
      sessionPaginationConfig,
    );
  }

  async getMySession(user_id: number, session_id: number) {
    const session = await this.sessionRepository.findOne({
      where: { id: session_id, user_id, is_active: true },
    });
    if (!session) {
      throw new NotFoundException(
        `Session with id ${session_id} not found or not active`,
      );
    }
    return session;
  }

  async revokeMySession(user_id: number, session_id: number) {
    const session = await this.sessionRepository.findOne({
      where: { id: session_id, user_id, is_active: true },
    });
    if (!session) {
      throw new NotFoundException(
        `Session with id ${session_id} not found or not active`,
      );
    }
    session.is_active = false;
    session.revoked_at = new Date();
    await this.sessionRepository.save(session);
    return session;
  }

  async deleteSessionById(id: number) {
    const result = await this.sessionRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
  }

  async deleteSessionsByUserId(user_id: number) {
    const result = await this.sessionRepository.delete({ user_id });
    if (!result.affected) {
      throw new NotFoundException(`No sessions found for user id ${user_id}`);
    }
  }

  async revokeSession(id: number, reason: string) {
    const session = await this.getSessionById(id);

    if (!session.is_active) {
      throw new NotFoundException(`Session with id ${id} is already revoked`);
    }

    session.is_active = false;
    session.revoked_at = new Date();
    session.revoke_reason = reason;
    await this.sessionRepository.save(session);
    return session;
  }

  async revokeSessionsByUserId(user_id: number, reason: string) {
    const sessions = await this.sessionRepository.find({ where: { user_id } });
    if (sessions.length === 0) {
      throw new NotFoundException(`No sessions found for user id ${user_id}`);
    }
    await this.sessionRepository.update(
      { user_id },
      { is_active: false, revoked_at: new Date(), revoke_reason: reason },
    );
    return sessions;
  }

  async unrevokeSession(id: number) {
    const session = await this.getSessionById(id);
    if (session.is_active === true) {
      throw new NotFoundException(`Session with id ${id} is not revoked`);
    }

    session.is_active = true;
    session.revoked_at = null;
    session.revoke_reason = null;
    await this.sessionRepository.save(session);
    return session;
  }
}
