import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Strategy } from 'passport-local';
import { plainToClass } from 'class-transformer';
import { LoginDto } from '../dto/login.dto';
import { validate } from 'class-validator';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const dto = plainToClass(LoginDto, { email, password });

    const errors = await validate(dto);
    if (errors.length > 0) {
      const messages = errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');

      throw new BadRequestException(`Validation failed: ${messages}`);
    }

    return await this.authService.validateUser(email, password);
  }
}
