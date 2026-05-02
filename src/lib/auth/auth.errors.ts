/**
 * IPVE Digital — Auth Error Types
 */

export class AuthError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message?: string, statusCode?: number) {
    super(message ?? code);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode ?? getStatusCode(code);
  }
}

function getStatusCode(code: string): number {
  switch (code) {
    case 'INVALID_CREDENTIALS':
    case 'INVALID_TOTP_CODE':
    case 'INVALID_PASSWORD':
    case 'INVALID_TEMP_TOKEN':
      return 401;
    case 'ACCOUNT_INACTIVE':
    case 'ACCOUNT_LOCKED':
    case 'TOKEN_REVOKED':
    case 'INVALID_REFRESH_TOKEN':
      return 403;
    case 'USER_NOT_FOUND':
    case 'TOTP_NOT_SETUP':
      return 404;
    case 'RATE_LIMITED':
      return 429;
    default:
      return 500;
  }
}
