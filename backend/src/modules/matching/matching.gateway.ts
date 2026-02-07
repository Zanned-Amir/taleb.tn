import {
  Logger,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WsExceptionFilter } from 'src/common/filters/ws-exceptions.filter';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { WsAuthMiddleware } from '../auth/middleware/ws-auth.middleware';
import { WsAuthorizationGuard } from '../auth/guards/ws-authorization.guard';
import { type CustomSocket } from '../auth/types/auth.interfaces';
import { MatchingService } from './matching.service';
import { MATCHING_EVENTS } from './types/matching.events';
import { EndMatchDto } from './dto/end-match.dto';

@UseFilters(new WsExceptionFilter())
@UsePipes(
  new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) }),
)
@WebSocketGateway(80, { transports: ['websocket'], namespace: '/matching' })
export class MatchingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger(MatchingGateway.name);
  @WebSocketServer() server!: Server;

  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private matchingService: MatchingService,
  ) {}

  afterInit(server: Server) {
    const authMiddleware = new WsAuthMiddleware(
      this.jwtService,
      this.authService,
    );

    server.use(authMiddleware.use());
    this.logger.log(
      'Matching Gateway initialized with authentication middleware',
    );
  }

  async handleDisconnect(client: CustomSocket) {
    const user = client.user;
    if (user) {
      await this.matchingService.cancelMatching(user.id);
      this.logger.log(`User ${user.id} disconnected and removed from queue`);
    }
  }

  handleConnection(client: CustomSocket) {
    const user = client.user;
    this.logger.log(
      `User ${user?.id} connected to matching gateway: ${client.id}`,
    );
  }

  @UseGuards(WsAuthorizationGuard)
  @SubscribeMessage(MATCHING_EVENTS.start_matching)
  async handleStartMatching(
    @ConnectedSocket() client: CustomSocket,
    @MessageBody() payload: any,
  ) {
    try {
      const user = client.user;
      this.logger.log(`User ${user.id} started matching request`);

      const match_result = await this.matchingService.startMatching(client);

      if (match_result.status === 'matched') {
        // Notify both users of the match
        const opponent = match_result.opponent;
        const self = match_result.self;
        const room_id = match_result.match_id; // Use match_id as room_id

        if (!opponent || !self) {
          throw new WsException('Invalid match data received');
        }

        // Send match found event to current client with room info
        client.emit(MATCHING_EVENTS.match_found, {
          match_id: match_result.match_id,
          room_id: room_id,
          opponent: {
            id: opponent.id,
            username: opponent.username,
            socket_id: opponent.socket_id,
          },
          message: `Matched with ${opponent.username}!`,
          next_action: 'join-video-room',
        });

        // Send match found event to opponent with room info
        this.server.to(opponent.socket_id).emit(MATCHING_EVENTS.match_found, {
          match_id: match_result.match_id,
          room_id: room_id,
          opponent: {
            id: self.id,
            username: self.username,
            socket_id: self.socket_id,
          },
          message: `Matched with ${self.username}!`,
          next_action: 'join-video-room',
        });

        this.logger.log(
          `Match found: ${user.id} <-> ${opponent.id} (Match ID: ${match_result.match_id}, Room ID: ${room_id})`,
        );
      } else {
        // Still waiting for a match
        client.emit(MATCHING_EVENTS.matching_status, {
          status: 'waiting',
          position: match_result.position,
          message: match_result.message,
        });

        this.logger.log(`User ${user.id} is waiting in matching queue`);
      }
    } catch (error: any) {
      this.logger.error(`Matching error: ${error.message}`, error.stack);
      client.emit(MATCHING_EVENTS.matching_error, {
        message: error.message || 'An error occurred during matching',
      });
    }
  }

  @UseGuards(WsAuthorizationGuard)
  @SubscribeMessage(MATCHING_EVENTS.cancel_matching)
  async handleCancelMatching(@ConnectedSocket() client: CustomSocket) {
    try {
      const user = client.user;
      await this.matchingService.cancelMatching(user.id);

      client.emit(MATCHING_EVENTS.matching_cancelled, {
        message: 'You have left the matching queue',
      });

      this.logger.log(`User ${user.id} cancelled matching`);
    } catch (error: any) {
      this.logger.error(`Cancel matching error: ${error.message}`);
      client.emit(MATCHING_EVENTS.matching_error, {
        message: error.message || 'Failed to cancel matching',
      });
    }
  }

  @UseGuards(WsAuthorizationGuard)
  @SubscribeMessage(MATCHING_EVENTS.end_match)
  async handleEndMatch(
    @ConnectedSocket() client: CustomSocket,
    @MessageBody() payload: EndMatchDto,
  ) {
    try {
      const user = client.user;
      const match = await this.matchingService.getMatch(payload.match_id);

      if (!match) {
        throw new WsException('Match not found');
      }

      // Check if user is part of this match
      if (match.user1.id !== user.id && match.user2.id !== user.id) {
        throw new WsException('You are not part of this match');
      }

      await this.matchingService.endMatch(payload.match_id, String(user.id));

      // Notify both users that match ended
      const opponent = match.user1.id === user.id ? match.user2 : match.user1;
      this.server.to(opponent.socket_id).emit(MATCHING_EVENTS.match_ended, {
        message: 'The other user ended the call',
      });

      client.emit(MATCHING_EVENTS.match_ended, {
        message: 'Match ended',
      });

      this.logger.log(`Match ${payload.match_id} ended by user ${user.id}`);
    } catch (error: any) {
      this.logger.error(`End match error: ${error.message}`);
      client.emit(MATCHING_EVENTS.matching_error, {
        message: error.message || 'Failed to end match',
      });
    }
  }
}
