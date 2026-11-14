import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: 'Math Study Group' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['public', 'private'], example: 'private' })
  @IsEnum(['public', 'private'])
  type: 'public' | 'private';

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isPermanent?: boolean;
}

export class UpdateRoomDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: ['public', 'private'] })
  @IsOptional()
  @IsEnum(['public', 'private'])
  type?: 'public' | 'private';
}

export class UpdateParticipantRoleDto {
  @ApiProperty({ enum: ['admin', 'moderator', 'participant'] })
  @IsEnum(['admin', 'moderator', 'participant'])
  role: 'admin' | 'moderator' | 'participant';
}
