import type { Request as ExpressRequest } from 'express';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends ExpressRequest {
  user: AuthenticatedUser;
}

export interface LocalAuthRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}
