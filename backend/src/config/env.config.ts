import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'pre-production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  VERSION: Joi.string().default('1.0'),
  APP_NAME: Joi.string().default('Taleb.tn Backend'),

  // Database configuration
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),

  // Cache configuration (Redis)
  REDIS_PORT: Joi.number().default(6379),
  REDIS_HOST: Joi.string().required(),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().default(0),

  // JWT configuration
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('10m'),

  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Email configuration for production
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().required(),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),
  EMAIL_FROM: Joi.string().required(),
  IS_EMAIL_SECURE: Joi.boolean().default(false),

  // Email configuration for testing
  EMAIL_HOST_TEST: Joi.string().optional(),
  EMAIL_PORT_TEST: Joi.number().optional(),
  EMAIL_USER_TEST: Joi.string().optional(),
  EMAIL_PASSWORD_TEST: Joi.string().optional(),
  EMAIL_FROM_TEST: Joi.string().optional(),
  IS_EMAIL_SECURE_TEST: Joi.boolean().default(false),

  ENABLE_EMAIL_SERVICE: Joi.boolean().default(false),
  ENABLE_DOCUMENTATION: Joi.boolean().default(false),
});
