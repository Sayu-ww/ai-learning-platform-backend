import { IsUrl } from 'class-validator';

export class SetRoomVideoDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  videoUrl: string;
}
