import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { VideoSyncService } from './video-sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddVideoDto } from './dto/videos.dto';
import type { AuthenticatedRequest } from '@common/types/authenticated-request';

@ApiTags('videos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('videos')
export class VideosController {
  constructor(
    private videosService: VideosService,
    private videoSyncService: VideoSyncService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a video' })
  @ApiResponse({ status: 201, description: 'Video added successfully' })
  async addVideo(@Request() req: AuthenticatedRequest, @Body() addVideoDto: AddVideoDto) {
    return this.videosService.addVideo(req.user.userId, addVideoDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get video by ID' })
  @ApiResponse({ status: 200, description: 'Video retrieved' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async getVideo(@Param('id') id: string) {
    return this.videosService.findById(id);
  }

  @Get('room/:roomId/sync-state')
  @ApiOperation({ summary: 'Get video sync state for room' })
  @ApiResponse({ status: 200, description: 'Sync state retrieved' })
  async getSyncState(@Param('roomId') roomId: string) {
    return this.videoSyncService.getSyncState(roomId);
  }
}
