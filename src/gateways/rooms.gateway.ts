import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard, type AuthenticatedSocket } from './guards/ws-jwt.guard';
import { RoomsService } from '@modules/rooms/rooms.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private roomsService: RoomsService) {}

  async handleConnection(client: AuthenticatedSocket) {
    const userId = client.userId;

    if (!userId) {
      console.warn('Client connection rejected: no userId after guard', {
        socketId: client.id,
      });
      client.disconnect(true);
      return;
    }

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    console.log(`Client connected: ${client.id}, User: ${userId}`);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId;

    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const { roomId } = data;
      const userId = client.userId;

      if (!roomId) {
        console.error('room:join called without roomId');
        return { error: 'Room ID is required' };
      }

      const isParticipant = await this.roomsService.isParticipant(roomId, userId);

      if (!isParticipant) {
        console.warn(`User ${userId} tried to join room ${roomId} but is not a participant`);
        return { error: 'Not a participant of this room' };
      }

      await client.join(roomId);
      console.log(`User ${userId} joined room ${roomId} via socket`);

      const participants = await this.roomsService.getParticipants(roomId);

      client.to(roomId).emit('room:user-joined', {
        userId,
        timestamp: new Date(),
      });

      return {
        success: true,
        participants,
      };
    } catch (error) {
      console.error('Error in room:join:', error);
      return { error: 'Failed to join room' };
    }
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = client.userId;

    await client.leave(roomId);

    client.to(roomId).emit('room:user-left', {
      userId,
      timestamp: new Date(),
    });

    return { success: true };
  }

  async notifyRoomUpdate(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }

  async notifyUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
}
