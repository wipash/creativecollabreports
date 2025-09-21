# Simple Password Authentication Spec

## Background
- The attendance app currently exposes attendee and parent details without any gate.
- Staff access the app from mobile browsers during event days, so we only need a lightweight shared password.
- Stack: Next.js 15 App Router with React Query at the root, API routes under `src/app/api`, and no existing auth.

## Goals
- Require a shared password once per browser session before any page or API route responds with data.
- Keep the password in an environment variable (`APP_PASSWORD`) so deployments can rotate it without code changes.
- Persist auth state for roughly 24 hours via an HTTP-only cookie and avoid repeated prompts while the session is valid.
- Redirect users back to their originally requested route after successful login with minimal friction.
- Stay compatible with middleware running on the Edge runtime (no Node-specific modules, no dynamic requires).

## Non-Goals
- No user-specific accounts, password resets, or role management.
- No rate limiting, captcha, or audit logging in this iteration (documented as future improvements).
- No database persistence for sessions; a signed cookie is sufficient.

## High-Level Flow
1. Request hits `middleware.ts`. If `APP_PASSWORD` is missing, log a warning and bypass auth (helps local development).
2. Middleware reads the `art-class-auth` cookie and verifies its signature/expiry.
3. When the cookie is missing or invalid, redirect to `/login?from=<original path + search>` for page requests, or return a `401` JSON response for API requests so fetch callers can react gracefully.
4. `/login` presents a password form; submission calls `/api/auth/login` with the entered password.
5. The login API compares against `APP_PASSWORD`. On success it issues a signed cookie valid for 24 hours and returns `{ success: true }`.
6. Client replaces history with the original route (`router.replace(from)`) and triggers `router.refresh()` so protected data refetches.
7. Optional logout endpoint clears the cookie so the next navigation requires authentication again.

## Environment Variable
```
# .env.local
APP_PASSWORD=your-shared-secret
```
Keep this in `.env.local.example` so new environments know to set it.

## Shared Session Helpers (`src/lib/auth/session.ts`)
Create a small utility module used by both middleware and the login route:

```ts
const encoder = new TextEncoder();
export const SESSION_COOKIE = 'art-class-auth';
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function signPayload(payload: string) {
  const secret = process.env.APP_PASSWORD;
  if (!secret) throw new Error('APP_PASSWORD is not set');

  const data = encoder.encode(`${payload}:${secret}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest).slice(0, 32); // keep it short but unpredictable
}

export async function generateSessionToken(expiresAt: number) {
  const signature = await signPayload(`${expiresAt}`);
  return `${expiresAt}.${signature}`;
}

export async function validateSessionToken(token: string, now: number = Date.now()) {
  const [expiresAtStr, signature] = token.split('.');
  const expiresAt = Number(expiresAtStr);
  if (!expiresAt || !signature) return false;
  if (now > expiresAt) return false;

  try {
    const expected = await signPayload(expiresAtStr);
    return signature === expected;
  } catch (error) {
    console.error('Auth validation failed:', error);
    return false;
  }
}
```
- Using `crypto.subtle.digest` keeps the helper compatible with the Edge runtime and with Node 18+.
- Helper throws when `APP_PASSWORD` is missing so callers can decide how to react.

## Middleware (`src/middleware.ts`)
- Export `export async function middleware(request: NextRequest)`.
- Define `const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];` and short-circuit if the pathname matches or begins with any public path.
- For assets, rely on the matcher configuration (below) to exclude `_next/*`, `favicon.ico`, and public files.
- Steps inside middleware:
  1. Attempt to read `APP_PASSWORD`. If absent, `console.warn` once per request and `return NextResponse.next()`.
  2. Read the cookie via `request.cookies.get(SESSION_COOKIE)?.value`.
  3. If the cookie is missing or `await validateSessionToken(cookieValue)` returns `false`:
     - For paths starting with `/api/`, respond with `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })` so the client fetch can surface an auth error.
     - Otherwise clone the URL, set pathname to `/login`, add `from` query param with the original `pathname + search`, and `return NextResponse.redirect(redirectUrl)`.
  4. Otherwise allow the request.
- Export matcher:
  ```ts
  export const config = {
    matcher: [
      '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
  };
  ```
- Do **not** import `cookies` from `next/headers` inside middleware; use only `NextRequest`/`NextResponse`.

## Login API (`src/app/api/auth/login/route.ts`)
- Parse JSON body `{ password: string }`. If the field is missing, return `400` with `{ error: 'Password required' }`.
- If `APP_PASSWORD` is missing, log an error and return `500` (`{ error: 'Authentication not configured' }`).
- Compare entered password; on mismatch return `401` with `{ error: 'Invalid password' }`.
- On success:
  1. `const expiresAt = Date.now() + SESSION_DURATION_MS;`
  2. `const token = await generateSessionToken(expiresAt);`
  3. `const cookieStore = await cookies(); cookieStore.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: SESSION_DURATION_MS / 1000, path: '/' });`
  4. Return `NextResponse.json({ success: true });`
- Catch unexpected errors and respond `500` with `{ error: 'Server error' }`.
- Optionally set `export const runtime = 'edge';` if we want parity with middleware—the helper already works on Edge.

## Login Page (`src/app/login/page.tsx`)
- Client component built with existing shadcn UI primitives (`Card`, `Input`, `Button`, `Alert`).
- Layout: centered card with app title, brief copy, password field, submit button.
- Functionality:
  - Focus the password input on mount (`useRef` + `useEffect`).
  - Toggle visibility button for the password field.
  - Submit handler:
    ```ts
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    ```
  - For 200 responses: clear errors, `router.replace(from)`, `router.refresh()`.
  - For 401: show inline error `"Incorrect password"` and reset the input.
  - For 500 or network failures: show `"Authentication service unavailable"`.
  - Use `setLoading(true/false)` to disable the button while the request is in flight.
- `const from = searchParams.get('from') ?? '/'` to pick the redirect target.
- Responsive/mobile: button and input fill width, adequate spacing for touch targets, avoid horizontal scroll.
- Accessibility: `aria-live="polite"` or `role="alert"` for the error message, label the password field.

## Optional Logout (`src/app/api/auth/logout/route.ts`)
- `const cookieStore = await cookies(); cookieStore.delete(SESSION_COOKIE); return NextResponse.json({ success: true });`
- Keep undocumented in the UI for now but mention as a building block for future admin control.

## Developer Notes
- Update `.env.local.example` with `APP_PASSWORD=` entry.
- Readme update (separate chore) should explain the new variable and login behavior.
- In middleware, catch and log validation exceptions so a tampered cookie doesn’t crash the request.
- Because React Query Devtools live inside the layout, ensure the login page still renders correctly (no extra wrappers needed).

## Testing Checklist
- [ ] Visiting `/` without a cookie redirects to `/login?from=%2F`.
- [ ] Submitting the correct password sets the cookie and sends the user back to the original path.
- [ ] Protected API routes (`/api/products`, `/api/attendees/:id`) return `401` JSON errors when unauthenticated and redirect to `/login` for page navigation.
- [ ] Incorrect passwords show an inline error and keep the user on `/login`.
- [ ] Cookie keeps the user signed in across reloads until 24 hours elapse.
- [ ] Clearing the cookie or waiting for expiry forces the next request through the login flow.
- [ ] Login page works on mobile Safari/Chrome (focus, keyboard, layout).
- [ ] With `APP_PASSWORD` missing, middleware logs a warning and allows navigation (dev mode), while the login API returns a 500 explaining the missing configuration.
- [ ] Optional logout endpoint clears the cookie and causes the next navigation to require login.

## Future Hardening Ideas
- Introduce rate limiting (e.g., limit login attempts per IP) and lockout messaging.
- Use a distinct signing secret instead of reusing `APP_PASSWORD`.
- Consider moving to a managed auth provider or at least hashed passwords.
- Add CSRF mitigation for the login POST (double-submit cookie or origin checks).
- Surface session expiry countdown or renewal prompts to staff.
