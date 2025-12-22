// middleware.ts (place in root or src folder)
import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,     // e.g., "/api/auth"
  authRoutes,        // e.g., ["/login", "/register"]
  privateRoutes,     // e.g., ["/my", "/orders", "/checkout/address", "/admin"]
} from "@/routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const pathname = nextUrl.pathname;

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = authRoutes.includes(pathname);
  const isPrivateRoute = privateRoutes.some((route) => pathname.startsWith(route));

  // Skip middleware logic entirely for these (just proceed)
  if (isApiAuthRoute) return null;

  // If on an auth page (login/register) and already logged in → redirect to home/dashboard
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  // If accessing a private route without being logged in → redirect to login
  if (isPrivateRoute && !isLoggedIn) {
    let callbackUrl = pathname + nextUrl.search;
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return Response.redirect(loginUrl);
  }

  // For all other routes (public pages, static assets, etc.) → proceed without auth check
  return null;
});

// Crucial: Restrict middleware to ONLY routes that need it
export const config = {
  matcher: [
    // Private/protected routes
    "/my/:path*",
    "/orders/:path*",
    "/checkout/address/:path*",
    "/admin/:path*",

    // Auth routes (login, register, etc.) – optional, but useful for redirecting logged-in users
    ...authRoutes.map((route) => `${route}`),

    // API auth routes if you want middleware to run there (usually not needed)
    // "/api/auth/:path*",
  ],
};