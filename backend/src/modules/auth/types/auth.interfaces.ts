import { Socket } from 'socket.io';
import { User } from 'src/modules/users/entities/user.entity';

export interface JwtPayload {
  user_id: number;
  session_id: number;
}

export interface AccessTokenPayload extends JwtPayload {
  m2fa_authenticated?: boolean;
  m2fa_required?: boolean;
}

export interface RefreshTokenPayload extends JwtPayload {
  m2fa_authenticated?: boolean;
  m2fa_required?: boolean;
}

export interface CustomSocket extends Socket {
  user: User;
  m2fa_authenticated?: boolean;
  m2fa_required?: boolean;
}
