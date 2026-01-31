import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { BaseOAuthState } from '../types/outh.type';

export class GithubAuthGuard extends AuthGuard('github') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest() as Request;

    const deviceFingerprint =
      request.headers['x-device-fingerprint'] ||
      (request.query.device_fingerprint as string) ||
      null;
    const type =
      request.headers['x-auth-type'] ||
      (request.query.auth_type as string) ||
      'none';

    const action =
      request.headers['x-action'] || (request.query.action as string) || null;

    const user_id =
      request.headers['x-user-id'] || (request.query.user_id as string) || null;

    const link_token =
      request.headers['x-link-token'] ||
      (request.query.link_token as string) ||
      null;

    // Always create state parameter with all data
    const state = Buffer.from(
      JSON.stringify({
        device_fingerprint: deviceFingerprint,
        auth_type: type,
        action: action,
        user_id: user_id,
        link_token: link_token,
      } as BaseOAuthState),
    ).toString('base64');

    return { state };
  }
}
