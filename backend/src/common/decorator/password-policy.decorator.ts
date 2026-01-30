// src/auth/decorators/password-policy.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  Validate,
  ValidationOptions,
} from 'class-validator';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Custom validator that checks password against policy
 */
@ValidatorConstraint({ name: 'isPasswordPolicyValid', async: true })
@Injectable()
export class PasswordPolicyValidator implements ValidatorConstraintInterface {
  constructor(private configService: ConfigService) {}

  async validate(password: any): Promise<boolean> {
    // Type guard - return false if password is not a string
    if (!password || typeof password !== 'string') {
      return false;
    }

    try {
      const policy = {
        minLength: this.configService.getOrThrow<number>(
          'PASSWORD_MIN_LENGTH',
          8, // default value
        ),
        requireUppercase: this.configService.getOrThrow<boolean>(
          'PASSWORD_REQUIRE_UPPERCASE',
        ),
        requireLowercase: this.configService.getOrThrow<boolean>(
          'PASSWORD_REQUIRE_LOWERCASE',
        ),
        requireNumbers: this.configService.getOrThrow<boolean>(
          'PASSWORD_REQUIRE_NUMBERS',
        ),
        requireSpecialChars: this.configService.getOrThrow<boolean>(
          'PASSWORD_REQUIRE_SPECIAL_CHARS',
        ),
      };

      // Check length
      if (policy.minLength && password.length < policy.minLength) return false;

      // Check uppercase
      if (policy.requireUppercase && !/[A-Z]/.test(password)) return false;

      // Check lowercase
      if (policy.requireLowercase && !/[a-z]/.test(password)) return false;

      // Check numbers
      if (policy.requireNumbers && !/\d/.test(password)) return false;

      // Check special characters
      if (
        policy.requireSpecialChars &&
        !/[!@#$%^&*()_+\-=\[\]{};:'"\\|,.<>\/?]/.test(password)
      )
        return false;

      return true;
    } catch (error) {
      console.error('Error in PasswordPolicyValidator:', error);
      return false;
    }
  }

  defaultMessage(): string {
    try {
      const policy = this.configService.get('auth.passwordPolicy');

      // Type guard for policy
      if (!policy) {
        return 'Password does not meet requirements';
      }

      const requirements: string[] = [];

      requirements.push(`at least ${policy.minLength} characters`);
      if (policy.requireUppercase) requirements.push('one uppercase letter');
      if (policy.requireLowercase) requirements.push('one lowercase letter');
      if (policy.requireNumbers) requirements.push('one number');
      if (policy.requireSpecialChars)
        requirements.push('one special character');

      return `Password must contain ${requirements.join(', ')}`;
    } catch (error) {
      return 'Password does not meet requirements';
    }
  }
}

/**
 * Decorator to apply all password policy validations
 */
export function IsPasswordPolicy(validationOptions?: ValidationOptions) {
  return applyDecorators(
    Transform(({ value }: TransformFnParams) =>
      typeof value === 'string' ? value.trim() : value,
    ),
    IsString({ message: 'password must be a string' }),
    IsNotEmpty({ message: 'password should not be empty' }),
    Validate(PasswordPolicyValidator, validationOptions),
  );
}
