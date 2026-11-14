import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  email?: string;
  role?: string;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.authenticateClient(context.switchToWs().getClient<AuthenticatedSocket>());
    return true;
  }

  authenticateClient(client: AuthenticatedSocket): void {
    if (client.userId) {
      return;
    }

    const token = client.handshake?.auth?.token;
    if (!token) {
      console.warn('WebSocket connection attempt without token', {
        socketId: client.id,
      });
      throw new WsException('Authentication token is required');
    }

    try {
      const payload = this.jwtService.verify<{
        sub: string;
        email?: string;
        role?: string;
      }>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.userId = payload.sub;
      client.email = payload.email;
      client.role = payload.role;

      console.log('WebSocket authenticated:', {
        userId: client.userId,
        socketId: client.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('WebSocket authentication failed:', {
        error: message,
        socketId: client.id,
      });
      throw new WsException('Authentication failed');
    }
  }
}
