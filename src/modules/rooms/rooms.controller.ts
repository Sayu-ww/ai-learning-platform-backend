import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRoomDto, UpdateRoomDto, UpdateParticipantRoleDto } from './dto/rooms.dto';
import { SendRoomMessageDto } from './dto/send-room-message.dto';
import { SetRoomVideoDto } from './dto/set-room-video.dto';
import { SaveVideoProgressDto } from './dto/video-progress.dto';
import { RoomsGateway } from '@gateways/rooms.gateway';
import type { AuthenticatedRequest } from '@common/types/authenticated-request';

@ApiTags('rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(
    private roomsService: RoomsService,
    private roomsGateway: RoomsGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created successfully' })
  async createRoom(@Request() req: AuthenticatedRequest, @Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(req.user.userId, createRoomDto);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public rooms' })
  @ApiResponse({ status: 200, description: 'Public rooms retrieved' })
  async getPublicRooms(@Query('limit') limit?: number) {
    return this.roomsService.findPublicRooms(limit);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get user rooms' })
  @ApiResponse({ status: 200, description: 'User rooms retrieved' })
  async getMyRooms(@Request() req: AuthenticatedRequest) {
    return this.roomsService.findUserRooms(req.user.userId);
  }

  @Get('invites/my')
  @ApiOperation({ summary: 'Get user invites' })
  @ApiResponse({ status: 200, description: 'Invites retrieved' })
  async getMyInvites(@Request() req: AuthenticatedRequest) {
    return this.roomsService.getInvites(req.user.userId);
  }

  @Post('invites/:inviteId/accept')
  @ApiOperation({ summary: 'Accept room invite' })
  @ApiResponse({ status: 200, description: 'Invite accepted' })
  async acceptInvite(@Request() req: AuthenticatedRequest, @Param('inviteId') inviteId: string) {
    return this.roomsService.acceptInvite(inviteId, req.user.userId);
  }

  @Delete('invites/:inviteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reject room invite' })
  @ApiResponse({ status: 204, description: 'Invite rejected' })
  async rejectInvite(@Request() req: AuthenticatedRequest, @Param('inviteId') inviteId: string) {
    await this.roomsService.rejectInvite(inviteId, req.user.userId);
  }

  @Post(':id/video')
  @ApiOperation({ summary: 'Save the current video URL for a room' })
  @ApiResponse({ status: 200, description: 'Video URL saved successfully' })
  async setRoomVideo(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SetRoomVideoDto,
  ) {
    const result = await this.roomsService.setCurrentVideo(id, req.user.userId, dto.videoUrl);

    // Notify all room participants about the video change via WebSocket
    await this.roomsGateway.notifyRoomUpdate(id, 'room:video-changed', {
      videoUrl: result.currentVideoUrl,
      videoSource: result.currentVideoSource,
      videoId: result.currentVideoId,
      changedBy: req.user.userId,
    });

    return result;
  }

  @Get(':id/video')
  @ApiOperation({ summary: 'Get current video for room' })
  @ApiResponse({ status: 200, description: 'Current video retrieved' })
  async getRoomVideo(@Param('id') id: string) {
    return this.roomsService.getCurrentVideo(id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a room' })
  @ApiResponse({ status: 200, description: 'Successfully joined room' })
  @ApiResponse({ status: 403, description: 'Cannot join private room' })
  async joinRoom(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.roomsService.joinRoom(id, req.user.userId);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get room participants' })
  @ApiResponse({ status: 200, description: 'Participants retrieved' })
  async getParticipants(@Param('id') id: string) {
    return this.roomsService.getParticipants(id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get room chat messages' })
  @ApiResponse({ status: 200, description: 'Room messages retrieved' })
  async getRoomMessages(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.roomsService.getRoomMessages(id, req.user.userId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a room chat message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendRoomMessage(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SendRoomMessageDto,
  ) {
    return this.roomsService.sendRoomMessage(id, req.user.userId, dto.content);
  }

  @Post(':id/participants/:userId')
  @ApiOperation({ summary: 'Add participant to room' })
  @ApiResponse({ status: 201, description: 'Participant added' })
  async addParticipant(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.roomsService.addParticipant(id, userId, req.user.userId);
  }

  @Delete(':id/participants/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove participant from room' })
  @ApiResponse({ status: 204, description: 'Participant removed' })
  async removeParticipant(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    await this.roomsService.removeParticipant(id, userId, req.user.userId);
  }

  @Put(':id/participants/:userId/role')
  @ApiOperation({ summary: 'Update participant role' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async updateParticipantRole(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateParticipantRoleDto,
  ) {
    return this.roomsService.updateParticipantRole(id, userId, dto.role, req.user.userId);
  }

  @Post(':id/invites/:userId')
  @ApiOperation({ summary: 'Invite user to room' })
  @ApiResponse({ status: 201, description: 'Invite sent' })
  async inviteUser(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.roomsService.createInvite(id, userId, req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiResponse({ status: 200, description: 'Room retrieved' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async getRoom(@Param('id') id: string) {
    return this.roomsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update room' })
  @ApiResponse({ status: 200, description: 'Room updated' })
  async updateRoom(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, req.user.userId, updateRoomDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete room' })
  @ApiResponse({ status: 204, description: 'Room deleted' })
  async deleteRoom(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.roomsService.delete(id, req.user.userId);
  }

  @Post(':id/video/progress')
  @ApiOperation({ summary: 'Save user video playback progress' })
  @ApiResponse({ status: 200, description: 'Progress saved' })
  async saveVideoProgress(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SaveVideoProgressDto,
  ) {
    return this.roomsService.saveVideoProgress(
      id,
      req.user.userId,
      dto.videoId,
      dto.currentTime,
      dto.duration,
    );
  }

  @Get(':id/video/:videoId/progress')
  @ApiOperation({ summary: 'Get user video playback progress' })
  @ApiResponse({ status: 200, description: 'Progress retrieved' })
  async getVideoProgress(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('videoId') videoId: string,
  ) {
    return this.roomsService.getVideoProgress(id, req.user.userId, videoId);
  }
}
