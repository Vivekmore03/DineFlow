import { NextRequest, NextResponse } from "next/server";
import {
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from "./lib/auth";

// Define protected route prefixes and their allowed roles
const PROTECTED_ROUTES = [
  { path: "/dashboard", roles: ["OWNER"] },
  { path: "/kitchen", roles: ["OWNER", "KITCHEN_STAFF"] },
  { path: "/settings", roles: ["OWNER"] },
];

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and API exceptions
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth/logout") // let logout bypass
  ) {
    return NextResponse.next();
  }

  let accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  let user = null;
  let response = NextResponse.next();
  let cookiesUpdated = false;

  // 1. Attempt access token verification
  if (accessToken) {
    user = await verifyAccessToken(accessToken);
  }

  // 2. Token Rotation: If access token is invalid/expired but refresh token exists
  if (!user && refreshToken) {
    const refreshPayload = await verifyRefreshToken(refreshToken);
    
    if (refreshPayload) {
      // Create new tokens
      const newPayload = {
        userId: refreshPayload.userId,
        role: refreshPayload.role,
        restaurantId: refreshPayload.restaurantId,
      };
      
      const newAccessToken = await signAccessToken(newPayload);
      const newRefreshToken = await signRefreshToken(newPayload);
      
      // Update tokens in response cookies
      response = NextResponse.next();
      setAuthCookies(response, newAccessToken, newRefreshToken);
      
      accessToken = newAccessToken;
      user = newPayload;
      cookiesUpdated = true;
    }
  }

  // 3. Check access for protected routes
  const matchedProtected = PROTECTED_ROUTES.find((route) =>
    pathname.startsWith(route.path)
  );

  if (matchedProtected) {
    if (!user) {
      // Not authenticated, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!matchedProtected.roles.includes(user.role)) {
      // Authenticated but unauthorized role
      if (user.role === "KITCHEN_STAFF") {
        return NextResponse.redirect(new URL("/kitchen", request.url));
      }
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }

    // Set user context in request headers for API / Server Component convenience
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", user.userId);
    requestHeaders.set("x-user-role", user.role);
    requestHeaders.set("x-restaurant-id", user.restaurantId || "");
    
    const nextResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // If cookies were updated during rotation, persist them
    if (cookiesUpdated) {
      setAuthCookies(nextResponse, accessToken!, refreshToken!);
    }
    return nextResponse;
  }

  // 4. Redirect logged-in users away from auth pages
  if (AUTH_ROUTES.includes(pathname) && user) {
    if (user.role === "OWNER") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else if (user.role === "KITCHEN_STAFF") {
      return NextResponse.redirect(new URL("/kitchen", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/ (except api/auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/customer|api/upload|api/restaurants/[^/]+/tables/[^/]+/qr|_next/static|_next/image|favicon.ico).*)",
  ],
};
