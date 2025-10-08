import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const PROTECTED_ROUTES = ["/dashboard"];
const PUBLIC_AUTH_ROUTES = ["/login", "/register"];

const intlMiddleware = createIntlMiddleware(routing);

async function authMiddleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Extract locale from pathname for accurate route matching
  const localePrefix = routing.locales.find((l) => pathname.startsWith(`/${l}`));
  const pathnameWithoutLocale = localePrefix
    ? pathname.slice(localePrefix.length)
    : pathname;
  const finalPath = pathnameWithoutLocale === "" ? "/" : pathnameWithoutLocale;

  let isTokenValid = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isTokenValid = true;
    } catch (err) {
      // Token is invalid, will be cleared later
    }
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    finalPath.startsWith(route)
  );
  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.includes(finalPath);

  let response: NextResponse;

  // Redirect away from protected routes if token is invalid
  if (isProtectedRoute && !isTokenValid) {
    response = NextResponse.redirect(new URL("/login", request.url));
  }
  // Redirect away from login/register if token is valid
  else if (isPublicAuthRoute && isTokenValid) {
    response = NextResponse.redirect(new URL("/dashboard", request.url));
  }
  // Otherwise, proceed with intl middleware
  else {
    response = intlMiddleware(request);
  }

  // If token exists but is invalid, clear it from the browser
  if (token && !isTokenValid) {
    response.cookies.set("token", "", { maxAge: -1 });
  }

  return response;
}

export default authMiddleware;

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
