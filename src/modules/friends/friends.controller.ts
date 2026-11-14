import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '@common/types/authenticated-request';

@ApiTags('friends')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all friends' })
  @ApiResponse({ status: 200, description: 'Friends list retrieved' })
  async getFriends(@Request() req: AuthenticatedRequest) {
    return this.friendsService.getFriends(req.user.userId);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get pending friend requests' })
  @ApiResponse({ status: 200, description: 'Pending requests retrieved' })
  async getPendingRequests(@Request() req: AuthenticatedRequest) {
    return this.friendsService.getPendingRequests(req.user.userId);
  }

  @Post(':friendId')
  @ApiOperation({ summary: 'Send friend request' })
  @ApiResponse({ status: 201, description: 'Friend request sent' })
  async sendFriendRequest(@Request() req: AuthenticatedRequest, @Param('friendId') friendId: string) {
    return this.friendsService.sendFriendRequest(req.user.userId, friendId);
  }

  @Put('requests/:requestId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept friend request' })
  @ApiResponse({ status: 200, description: 'Friend request accepted' })
  async acceptFriendRequest(@Request() req: AuthenticatedRequest, @Param('requestId') requestId: string) {
    return this.friendsService.acceptFriendRequest(requestId, req.user.userId);
  }

  @Delete('requests/:requestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reject friend request' })
  @ApiResponse({ status: 204, description: 'Friend request rejected' })
  async rejectFriendRequest(@Request() req: AuthenticatedRequest, @Param('requestId') requestId: string) {
    await this.friendsService.rejectFriendRequest(requestId, req.user.userId);
  }

  @Delete(':friendId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove friend' })
  @ApiResponse({ status: 204, description: 'Friend removed' })
  async removeFriend(@Request() req: AuthenticatedRequest, @Param('friendId') friendId: string) {
    await this.friendsService.removeFriend(req.user.userId, friendId);
  }
}
