import { BadRequestException } from '@nestjs/common';
import { extractStateGoogle } from '../auth-google/utils/extract-state.utils';

/**
 * Validates OAuth state parameter
 * Ensures all required fields are present and valid based on the action
 * @param state - The state parameter from OAuth callback
 * @throws BadRequestException if validation fails
 */
export const validateOAuthState = (state: string): void => {
  if (!state) {
    throw new BadRequestException('State parameter is required');
  }

  try {
    const { device_fingerprint, auth_type, action, user_id, link_token } =
      extractStateGoogle(state);

    // Validate device_fingerprint
    if (!device_fingerprint) {
      throw new BadRequestException('Missing device_fingerprint in state');
    }

    // Validate action
    if (!action || !['login', 'link'].includes(action)) {
      throw new BadRequestException(
        'Invalid action. Must be either "login" or "link"',
      );
    }

    // Validate auth_type
    if (!auth_type || !['cookie', 'header', 'none'].includes(auth_type)) {
      throw new BadRequestException(
        'Invalid auth_type. Must be one of: "cookie", "header", or "none"',
      );
    }

    // Validate login action
    if (action === 'login') {
      if (auth_type === 'none') {
        throw new BadRequestException(
          'Login action requires auth_type to be "cookie" or "header"',
        );
      }
    }

    // Validate link action
    if (action === 'link') {
      if (!user_id) {
        throw new BadRequestException('Link action requires user_id in state');
      }
      if (!link_token) {
        throw new BadRequestException(
          'Link action requires link_token in state',
        );
      }

      if (!link_token.match(/^[0-9a-f-]{36}$/i)) {
        throw new BadRequestException('Invalid link_token format');
      }
    }
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException(
      'Failed to parse OAuth state parameter: ' + (error as Error).message,
    );
  }
};
