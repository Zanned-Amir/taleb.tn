import { Injectable, Logger } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/constant/redis.constant';
import { Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { WsException } from '@nestjs/websockets/errors/ws-exception';
import { CustomSocket } from '../auth/types/auth.interfaces';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private readonly QUEUE_KEY = 'matching_queue:users';
  private readonly MATCH_KEY_PREFIX = 'match:';
  private readonly USER_MATCH_KEY_PREFIX = 'user_match:';
  private readonly MATCH_TIMEOUT = 3600; // 1 hour in seconds

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  async startMatching(client: CustomSocket) {
    const user = client.user;

    if (!user || !user.id) {
      throw new WsException('User not authenticated');
    }

    // Check if user is already in a queue or matched
    const existing_match = await this.redisClient.get(
      `${this.USER_MATCH_KEY_PREFIX}${user.id}`,
    );

    if (existing_match) {
      throw new WsException('User is already matched or in a matching queue');
    }

    // Add user to matching queue with timestamp
    await this.redisClient.zadd(
      this.QUEUE_KEY,
      Date.now(),
      JSON.stringify({
        user_id: String(user.id),
        username: user.full_name,
        socket_id: client.id,
      }),
    );

    this.logger.log(
      `User ${user.id} (${user.full_name}) added to matching queue`,
    );

    // Try to match users - convert user.id to string for comparison
    return await this.findMatch(String(user.id), client.id);
  }

  private async findMatch(user_id: string, socket_id: string) {
    // Get all waiting users
    const waiting_users = await this.redisClient.zrange(this.QUEUE_KEY, 0, -1);

    if (waiting_users.length < 2) {
      return {
        status: 'waiting',
        message: 'Waiting for another user to join...',
        position: Math.max(0, waiting_users.length - 1),
      };
    }

    // Get the first two users in queue
    const user1_data = JSON.parse(waiting_users[0]);
    const user2_data = JSON.parse(waiting_users[1]);

    // Create a match
    const match_id = uuidv4();
    const match_data = {
      match_id,
      user1: {
        id: user1_data.user_id,
        username: user1_data.username,
        socket_id: user1_data.socket_id,
      },
      user2: {
        id: user2_data.user_id,
        username: user2_data.username,
        socket_id: user2_data.socket_id,
      },
      created_at: Date.now(),
      status: 'active',
    };

    // Store match in Redis
    await this.redisClient.setex(
      `${this.MATCH_KEY_PREFIX}${match_id}`,
      this.MATCH_TIMEOUT,
      JSON.stringify(match_data),
    );

    // Link both users to their match
    await this.redisClient.setex(
      `${this.USER_MATCH_KEY_PREFIX}${user1_data.user_id}`,
      this.MATCH_TIMEOUT,
      match_id,
    );
    await this.redisClient.setex(
      `${this.USER_MATCH_KEY_PREFIX}${user2_data.user_id}`,
      this.MATCH_TIMEOUT,
      match_id,
    );

    // Remove matched users from queue
    await this.redisClient.zrem(
      this.QUEUE_KEY,
      waiting_users[0],
      waiting_users[1],
    );

    this.logger.log(
      `Match created: ${match_id} between ${user1_data.user_id} and ${user2_data.user_id}`,
    );

    this.logger.log(
      `findMatch - user_id: ${user_id}, user1: ${user1_data.user_id}, user2: ${user2_data.user_id}`,
    );

    const opponent =
      user_id === user1_data.user_id ? match_data.user2 : match_data.user1;
    const self =
      user_id === user1_data.user_id ? match_data.user1 : match_data.user2;

    this.logger.log(
      `Match result - opponent: ${JSON.stringify(opponent)}, self: ${JSON.stringify(self)}`,
    );

    return {
      status: 'matched',
      match_id,
      opponent,
      self,
    };
  }

  async cancelMatching(user_id: string | number) {
    // Remove user from queue
    const queue_data = await this.redisClient.zrange(this.QUEUE_KEY, 0, -1);
    const user_id_str = String(user_id);
    const user_in_queue = queue_data.find((user) => {
      const data = JSON.parse(user);
      return data.user_id === user_id_str;
    });

    if (user_in_queue) {
      await this.redisClient.zrem(this.QUEUE_KEY, user_in_queue);
      this.logger.log(`User ${user_id} removed from matching queue`);
    }

    // Check if user has an active match and end it
    const match_id = await this.redisClient.get(
      `${this.USER_MATCH_KEY_PREFIX}${user_id}`,
    );
    if (match_id) {
      await this.endMatch(match_id, String(user_id));
    }
  }

  async getMatch(match_id: string) {
    const match_data = await this.redisClient.get(
      `${this.MATCH_KEY_PREFIX}${match_id}`,
    );
    return match_data ? JSON.parse(match_data) : null;
  }

  async endMatch(match_id: string, user_id: string) {
    const match_data = await this.getMatch(match_id);
    if (!match_data) {
      return;
    }

    // Remove match data
    await this.redisClient.del(`${this.MATCH_KEY_PREFIX}${match_id}`);

    // Remove user match links
    await this.redisClient.del(
      `${this.USER_MATCH_KEY_PREFIX}${match_data.user1.id}`,
    );
    await this.redisClient.del(
      `${this.USER_MATCH_KEY_PREFIX}${match_data.user2.id}`,
    );

    this.logger.log(`Match ${match_id} ended by user ${user_id}`);
  }

  async getUserMatch(user_id: string) {
    const match_id = await this.redisClient.get(
      `${this.USER_MATCH_KEY_PREFIX}${user_id}`,
    );
    if (!match_id) {
      return null;
    }
    return await this.getMatch(match_id);
  }
}
