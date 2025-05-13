import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    });

    // Define public paths that don't require authentication
    const publicPaths = ['/', '/login', '/register', '/api/test-db', '/api/test-user'];
    const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
    const isApiAuthPath = request.nextUrl.pathname.startsWith('/api/auth/');
    const isApiPath = request.nextUrl.pathname.startsWith('/api/');

    // Allow public paths and auth API routes
    if (isPublicPath || isApiAuthPath) {
        if (token && isPublicPath && request.nextUrl.pathname !== '/') {
            // If user is already logged in and tries to access public pages,
            // redirect to booking page
            return NextResponse.redirect(new URL('/booking', request.url));
        }
        return NextResponse.next();
    }

    // For API routes, check for token
    if (isApiPath && !token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Protect all other routes
    if (!token) {
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}; 