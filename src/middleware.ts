import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/login',
  '/admin/login',
  '/change-password',
  '/'  // Add this to allow access to home page
];

const PROTECTED_PATHS = [
  '/dashboard',
  '/profile',
  '/search'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('Middleware processing path:', pathname);

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    console.log('Public path accessed:', pathname);
    return NextResponse.next();
  }

  // Handle admin routes
  if (pathname.startsWith('/admin/')) {
    console.log('Admin route accessed:', pathname);
    const adminToken = request.cookies.get('adminToken')?.value;
    console.log('Admin token from cookies:', adminToken);

    // If trying to access protected admin path without token
    if (pathname !== '/admin/login') {
      if (!adminToken) {
        console.log('No admin token, redirecting to login');
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // Verify admin token
      if (adminToken !== 'demo-admin-token') {
        console.log('Invalid admin token, redirecting to login');
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      console.log('Admin token verified, proceeding');
      return NextResponse.next();
    }

    // Skip token check for login page
    return NextResponse.next();
  }

  // Handle protected student routes
  if (PROTECTED_PATHS.includes(pathname) || pathname.startsWith('/dashboard/')) {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|favicon.ico).*)'],
}; 