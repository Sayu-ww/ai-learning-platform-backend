import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { VideoSyncService } from '@modules/videos/video-sync.service';
import { RoomsService } from '@modules/rooms/rooms.service';

interface AuthenticatedSocket extends Socket {
  userId: string;
  id: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class VideoSyncGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private videoSyncService: VideoSyncService,
    private roomsService: RoomsService,
  ) {}

  @SubscribeMessage('video:play')
  async handlePlay(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; time: number },
  ) {
    const { roomId, time } = data;
    const userId = client.userId;

    const isParticipant = await this.roomsService.isParticipant(roomId, userId);
    if (!isParticipant) {
      return { error: 'Not a participant' };
    }

    const state = await this.videoSyncService.updatePlayState(roomId, userId, true, time);

    if (state.mode === 'synchronized') {
      this.server.to(roomId).emit('video:state-changed', {
        isPlaying: true,
        currentTime: time,
        isSynchronized: true,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('video:pause')
  async handlePause(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; time: number },
  ) {
    const { roomId, time } = data;
    const userId = client.userId;

    const isParticipant = await this.roomsService.isParticipant(roomId, userId);
    if (!isParticipant) {
      return { error: 'Not a participant' };
    }

    const state = await this.videoSyncService.updatePlayState(roomId, userId, false, time);

    if (state.mode === 'synchronized') {
      this.server.to(roomId).emit('video:state-changed', {
        isPlaying: false,
        currentTime: time,
        isSynchronized: true,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('video:seek')
  async handleSeek(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; time: number },
  ) {
    const { roomId, time } = data;
    const userId = client.userId;

    const isParticipant = await this.roomsService.isParticipant(roomId, userId);
    if (!isParticipant) {
      return { error: 'Not a participant' };
    }

    const state = await this.videoSyncService.seekTo(roomId, userId, time);

    if (state.mode === 'synchronized') {
      client.to(roomId).emit('video:seek-to', { time });
    }

    return { success: true };
  }

  @SubscribeMessage('video:gather-all')
  async handleGatherAll(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; time: number },
  ) {
    const { roomId, time } = data;
    const userId = client.userId;

    try {
      const state = await this.videoSyncService.enableSync(roomId, userId, time);

      this.server.to(roomId).emit('video:seek-to', { time });
      this.server.to(roomId).emit('video:sync-enabled', {
        currentTime: time,
        isPlaying: state.isPlaying,
      });

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('video:pause-all')
  async handlePauseAll(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = client.userId;

    try {
      const state = await this.videoSyncService.getSyncState(roomId);
      await this.videoSyncService.updatePlayState(
        roomId,
        userId,
        false,
        state.currentTime ?? undefined,
      );

      this.server.to(roomId).emit('video:state-changed', {
        isPlaying: false,
        currentTime: state.currentTime,
        isSynchronized: state.mode === 'synchronized',
      });

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('video:sync-disable')
  async handleSyncDisable(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = client.userId;

    try {
      await this.videoSyncService.disableSync(roomId, userId);

      this.server.to(roomId).emit('video:sync-disabled');

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('video:get-state')
  async handleGetState(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;

    const state = await this.videoSyncService.getSyncState(roomId);

    return {
      mode: state.mode,
      currentTime: state.currentTime,
      isPlaying: state.isPlaying,
    };
  }
}
