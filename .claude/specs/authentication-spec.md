# Simple Password Authentication Spec

## Problem
The app will be accessed via mobile devices on event days and needs basic password protection to prevent unauthorized access to attendee personal information.

## Requirements
- Simple password check (not user-specific authentication)
- Password stored as environment variable
- Remember authentication state so password isn't required on every page load
- Work on mobile browsers
- Minimal UX friction for authorized staff

## Solution Architecture

### 1. Next.js Middleware Approach
Use Next.js middleware to check authentication before serving any pages.

### 2. Authentication Flow
1. User visits any page → Middleware checks for auth cookie
2. If no valid cookie → Redirect to /login page
3. User enters password → Verify against env variable
4. If correct → Set HTTP-only cookie → Redirect to originally requested page
5. Cookie remains valid for session (e.g., 24 hours)

## Implementation Details

### 1. Environment Variable
```env
# .env.local
APP_PASSWORD=your-secure-password-here
```

### 2. Middleware Implementation
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'art-class-auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function middleware(request: NextRequest) {
  // Skip auth for login page and API routes
  if (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Check for valid session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie || !isValidSession(sessionCookie.value)) {
    // Redirect to login, preserving the original URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

function isValidSession(token: string): boolean {
  // Simple validation - in production, use proper JWT or encrypted tokens
  try {
    const [timestamp, hash] = token.split('.');
    const validUntil = parseInt(timestamp);

    // Check if session is still valid
    if (Date.now() > validUntil) return false;

    // Verify hash (simplified - use proper crypto in production)
    const expectedHash = createHash(timestamp);
    return hash === expectedHash;
  } catch {
    return false;
  }
}

function createHash(timestamp: string): string {
  // Simple hash - in production use crypto with secret
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(timestamp + process.env.APP_PASSWORD)
    .digest('hex')
    .substring(0, 16);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

### 3. Login Page Component
```tsx
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        router.push(from);
      } else {
        setError('Incorrect password');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Holiday Art Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoFocus
                autoComplete="current-password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4. Authentication API Route
```typescript
// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'art-class-auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // Check password against environment variable
    if (password !== process.env.APP_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Create session token
    const validUntil = Date.now() + SESSION_DURATION;
    const token = createSessionToken(validUntil);

    // Set HTTP-only cookie
    cookies().set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function createSessionToken(validUntil: number): string {
  const crypto = require('crypto');
  const hash = crypto
    .createHash('sha256')
    .update(validUntil + process.env.APP_PASSWORD)
    .digest('hex')
    .substring(0, 16);

  return `${validUntil}.${hash}`;
}
```

### 5. Logout Functionality (Optional)
```typescript
// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  cookies().delete('art-class-auth');
  return NextResponse.json({ success: true });
}
```

## Security Considerations

### Basic Implementation (Current Spec)
- Password stored in environment variable
- HTTP-only cookie prevents JavaScript access
- Simple session token with expiry
- Suitable for internal tools with low security requirements

### Enhanced Security (Future Considerations)
- Use bcrypt for password hashing
- Implement JWT tokens with proper signing
- Add CSRF protection
- Rate limiting on login attempts
- Secure cookie flag in production
- Consider using NextAuth.js for more robust solution

## Mobile Considerations
- Large touch targets for password input
- Show/hide password toggle
- Auto-focus password field
- Remember me option for longer sessions
- Clear error messages
- Loading states for slow connections

## Environment Variables Required
```env
APP_PASSWORD=your-secure-password-here
```

## Alternative: Basic Auth Header
Simpler but less user-friendly approach using HTTP Basic Authentication:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get('authorization');

  if (!basicAuth) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  const auth = basicAuth.split(' ')[1];
  const [user, pwd] = Buffer.from(auth, 'base64').toString().split(':');

  if (pwd !== process.env.APP_PASSWORD) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  return NextResponse.next();
}
```

## Testing Checklist
- [ ] Password validation works
- [ ] Cookie persists across page refreshes
- [ ] Cookie expires after 24 hours
- [ ] Redirect to original page after login
- [ ] Works on mobile browsers
- [ ] Logout clears session
- [ ] Incorrect password shows error
- [ ] API routes are protected