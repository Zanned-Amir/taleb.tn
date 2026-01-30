import { IsIP, IsOptional, IsString } from 'class-validator';

export class SessionDto {
  @IsOptional()
  @IsString()
  device_fingerprint: string | null;

  @IsIP()
  ip_address: string;

  @IsString()
  user_agent: string;
}
