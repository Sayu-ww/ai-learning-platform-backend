import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/users.dto';
import type { AuthenticatedRequest } from '@common/types/authenticated-request';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getCurrentUser(@Request() req: AuthenticatedRequest) {
    const user = await this.usersService.findById(req.user.userId);
    const profile = await this.usersService.getProfile(req.user.userId);
    const { passwordHash, ...userData } = user;
    return { user: userData, profile };
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  @ApiOperation({ summary: 'Search users by email or name' })
  @ApiResponse({ status: 200, description: 'Users found' })
  async search(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.usersService.search(query, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    const profile = await this.usersService.getProfile(id);
    const { passwordHash, ...userData } = user;
    return { user: userData, profile };
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }
}
