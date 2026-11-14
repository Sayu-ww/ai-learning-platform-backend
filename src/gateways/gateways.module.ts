import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RoomsGateway } from './rooms.gateway';
import { VideoSyncGateway } from './video-sync.gateway';
import { RoomsModule } from '@modules/rooms/rooms.module';
import { VideosModule } from '@modules/videos/videos.module';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@Module({
  imports: [
    RoomsModule,
    VideosModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RoomsGateway, VideoSyncGateway, WsJwtGuard],
  exports: [RoomsGateway, VideoSyncGateway],
})
export class GatewaysModule {}
