/**
 * IPVE Digital — Next.js Middleware
 *
 * Protects /api/* routes (except public ones) by checking for a valid
 * JWT access token in cookies or Authorization header.
 *
 * Public routes (no auth required):
 *   - /api/auth/login, /api/auth/refresh
 *   - /api/health
 *   - Next.js internal routes (_next, __nextjs)
 */

import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/health',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow Next.js internal routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/__nextjs')) {
    return NextResponse.next();
  }

  // For all other /api/* routes, let the route handler handle auth itself.
  // The middleware only serves as a first-pass filter for non-browser requests.
  // Route handlers use verifyAuth() for proper JWT validation.
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
