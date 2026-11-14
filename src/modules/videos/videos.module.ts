import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { VideoSyncService } from './video-sync.service';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [DatabaseModule, RoomsModule],
  controllers: [VideosController],
  providers: [VideosService, VideoSyncService],
  exports: [VideosService, VideoSyncService],
})
export class VideosModule {}
