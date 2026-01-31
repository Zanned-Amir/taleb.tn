import { IsOptional } from 'class-validator';

export class UpdateOAuthDto {
  @IsOptional()
  is_active?: boolean;
}
