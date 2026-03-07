import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Strict session validation: check token in DB
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token && token.jti) {
      // Validate session in DB
      const res = await fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.jti }),
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
  const response = NextResponse.redirect('/login');
  response.cookies.delete('next-auth.session-token');
  response.cookies.delete('next-auth.csrf-token');
  return response;

  return NextResponse.next();
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
