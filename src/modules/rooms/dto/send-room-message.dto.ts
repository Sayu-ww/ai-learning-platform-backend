import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendRoomMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
