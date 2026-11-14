import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class SaveVideoProgressDto {
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @IsNumber()
  @Min(0)
  currentTime: number;

  @IsNumber()
  @Min(0)
  duration?: number;
}
