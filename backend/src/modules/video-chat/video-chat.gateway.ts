import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WsExceptionFilter } from 'src/common/filters/ws-exceptions.filter';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { WsAuthMiddleware } from '../auth/middleware/ws-auth.middleware';
import { WsAuthorizationGuard } from '../auth/guards/ws-authorization.guard';
import { type CustomSocket } from '../auth/types/auth.interfaces';
import { VIDEO_CHAT_EVENTS } from './types/video-chat.events';
import { JoinRoomDto } from './dto/join-room.dto';
import { SendOfferDto } from './dto/send-offer.dto';
import { SendAnswerDto } from './dto/send-answer.dto';
import { SendIceCandidateDto } from './dto/send-ice-candidate.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { SendMessageDto } from './dto/send-message.dto';

@UseFilters(new WsExceptionFilter())
@WebSocketGateway(80, { transports: ['websocket'], namespace: '/video-chat' })
export class VideoChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger(VideoChatGateway.name);
  @WebSocketServer() server!: Server;

  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  afterInit(server: Server) {
    const authMiddleware = new WsAuthMiddleware(
      this.jwtService,
      this.authService,
    );

    server.use(authMiddleware.use());
    this.logger.log(
      'Video Chat Gateway initialized with authentication middleware',
    );
  }

  handleConnection(client: CustomSocket) {
    const user = client.user;
    this.logger.log(
      `User ${user?.id} connected to video chat gateway: ${client.id}`,
    );
  }

  handleDisconnect(client: CustomSocket) {
    const user = client.user;
    if (user) {
      this.logger.log(`User ${user.id} disconnected from video chat`);
      // Notify others in the room that this user disconnected
      client.broadcast.emit(VIDEO_CHAT_EVENTS.peer_disconnected, {
        user_id: user.id,
        message: 'User disconnected',
      });
    }
  }

  @UseGuards(WsAuthorizationGuard)
  @SubscribeMessage(VIDEO_CHAT_EVENTS.join_room)
  async handleJoinRoom(
    @ConnectedSocket() client: CustomSocket,
    @MessageBody() payload: JoinRoomDto,
  ) {
    try {
      const user = client.user;
      const { room_id, match_id } = payload;

      if (!room_id || !match_id) {
        throw new WsException('Room ID and Match ID are required');
      }

      // Join the user to the room
      client.join(room_id);
      this.logger.log(`User ${user.id} joined room ${room_id}`);

      // Notify others in the room that a new user joined
      this.server.to(room_id).emit(VIDEO_CHAT_EVENTS.peer_joined, {
        user_id: user.id,
        username: user.full_name,
        room_id,
      });

      client.emit(VIDEO_CHAT_EVENTS.joined_room, {
        room_id,
        match_id,
        message: `You joined room ${room_id}`,
      });
    } catch (error: any) {
      this.logger.error(`Join room error: ${error.message}`);
      client.emit(VIDEO_CHAT_EVENTS.video_chat_error, {
        message: error.message || 'Failed to join room',
      });
    }
  }

  @UseGuards(WsAuthorizationGuard)
  @SubscribeMessage(VIDEO_CHAT_EVENTS.send_offer)
  async handleSendOffer(
    @ConnectedSocket() client: CustomSocket,
    @MessageBody() payload: SendOfferDto,
  ) {
    try {
      const user = client.user;
      const { room_id, offer } = payload;

      if (!room_id || !offer) {
        throw new WsException('Room ID and offer are required');
      }

      this.logger.log(`User ${user.id} sent WebRTC offer in room ${room_id}`);

      // Broadcast the offer to all other users in the room
      client.to(room_id).emit(VIDEO_CHAT_EVENTS.receive_offer, {
        user_id: user.id,
        username: user.full_name,
        offer,
      });
    } catch (error: any) {
      this.logger.error(`Send offer error: ${error.message}`);
      client.emit(VIDEO_CHAT_EVENTS.video_chat_error, {
        message: error.message || 'Failed to send offer',
      });
    }
  }

  @UseGuards(WsAuthorizationGuard)
  @SubscribeMessage(VIDEO_CHAT_EVENTS.send_answer)
  async handleSendAnswer(
    @ConnectedSocket() client: CustomSocket,
    @MessageBody() payload: SendAnswerDto,
  ) {
    try {
      const user = client.user;
      const { room_id, answer } = payload;

      if (!room_id || !answer) {
        throw new WsException('Room ID and answer are required');
      }

      this.logger.log(`User ${user.id} sent WebRTC answer in room ${room_id}`);

      // Broadcast the answer to all other users in the room
      client.to(room_id).emit(VIDEO_CHAT_EVENTS.receive_answer, {
        user_id: user.id,
        username: user.full_name,
        answer,
      });
    } catch (error: any) {
      this.logger.error(`Send answer error: ${error.message}`);
      client.emit(VIDEO_CHAT_EVENTS.video_chat_error, {
        message: error.message || 'Failed to send answer',
      });
    }
  }

  @UseGuards(WsAuthorizationGuard)
  @SubscribeMessage(VIDEO_CHAT_EVENTS.send_ice_candidate)
  async handleSendIceCandidate(
    @ConnectedSocket() client: CustomSocket,
    @MessageBody() payload: SendIceCandidateDto,
  ) {
    try {
      const user = client.user;
      const { room_id, candidate } = payload;

      if (!room_id || !candidate) {
        throw new WsException('Room ID and candidate are required');
      }

      this.logger.log(`User ${user.id} sent ICE candidate in room ${room_id}`);

      // Broadcast the ICE candidate to all other users in the room
      client.to(room_id).emit(VIDEO_CHAT_EVENTS.receive_ice_candidate, {
        user_id: user.id,
        candidate,
      });
    } catch (error: any) {
      this.logger.error(`Send ICE candidate error: ${error.message}`);
      client.emit(VIDEO_CHAT_EVENTS.video_chat_error, {
        message: error.message || 'Failed to send ICE candidate',
      });
    }
  }

  @UseGuards(WsAuthorizationGuard)
  @SubscribeMessage(VIDEO_CHAT_EVENTS.leave_room)
  async handleLeaveRoom(
    @ConnectedSocket() client: CustomSocket,
    @MessageBody() payload: LeaveRoomDto,
  ) {
    try {
      const user = client.user;
      const { room_id } = payload;

      if (!room_id) {
        throw new WsException('Room ID is required');
      }

      // Leave the room
      client.leave(room_id);
      this.logger.log(`User ${user.id} left room ${room_id}`);

      // Notify others in the room that user left
      this.server.to(room_id).emit(VIDEO_CHAT_EVENTS.peer_left, {
        user_id: user.id,
        message: `User ${user.full_name} left the room`,
      });

      client.emit(VIDEO_CHAT_EVENTS.left_room, {
        room_id,
        message: `You left room ${room_id}`,
      });
    } catch (error: any) {
      this.logger.error(`Leave room error: ${error.message}`);
      client.emit(VIDEO_CHAT_EVENTS.video_chat_error, {
        message: error.message || 'Failed to leave room',
      });
    }
  }

  @UseGuards(WsAuthorizationGuard)
  @SubscribeMessage(VIDEO_CHAT_EVENTS.send_message)
  async handleSendMessage(
    @ConnectedSocket() client: CustomSocket,
    @MessageBody() payload: SendMessageDto,
  ) {
    try {
      const user = client.user;
      const { room_id, message } = payload;

      if (!room_id || !message) {
        throw new WsException('Room ID and message are required');
      }

      this.logger.log(`User ${user.id} sent message in room ${room_id}`);

      // Broadcast the message to all other users in the room
      client
        .to(room_id)
        .except(client.id)
        .emit(VIDEO_CHAT_EVENTS.receive_message, {
          user_id: user.id,
          username: user.full_name,
          message,
        });
    } catch (error: any) {
      this.logger.error(`Send message error: ${error.message}`);
      client.emit(VIDEO_CHAT_EVENTS.video_chat_error, {
        message: error.message || 'Failed to send message',
      });
    }
  }
}
