import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddVideoDto {
  @ApiProperty({ enum: ['youtube', 'vimeo', 'rutube', 'archive'] })
  @IsEnum(['youtube', 'vimeo', 'rutube', 'archive'])
  source: 'youtube' | 'vimeo' | 'rutube' | 'archive';

  @ApiProperty({ example: 'dQw4w9WgXcQ' })
  @IsString()
  @IsNotEmpty()
  externalId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

export class VideoSyncCommandDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  time?: number;
}
