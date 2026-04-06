import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (pathname === '/' || pathname === '/login') {
    return NextResponse.next();
  }

  // Strict session validation: check token in DB
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const sessionToken = token?.sessionToken || token?.jti || token?.sub;
    if (sessionToken) {
      // Validate session in DB
      const validateUrl = new URL('/api/session/validate', request.nextUrl.origin);
      const res = await fetch(validateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: sessionToken }),
      });
      const data = await res.json();
      if (data.active) {
        return NextResponse.next();
      }
    }
  } catch (error) {
    console.error('Middleware token error:', error);
  }

  // Session invalid: clear cookies and redirect to login
  const response = NextResponse.redirect(new URL('/', request.nextUrl.origin));
  response.cookies.delete('next-auth.session-token');
  response.cookies.delete('next-auth.csrf-token');
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
