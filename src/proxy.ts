import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_SEGMENTS = ["/dashboard", "/appointments", "/patients", "/settings", "/triages"];

function isProtectedPath(pathname: string) {
  return PROTECTED_SEGMENTS.some(
    (seg) => pathname === seg || pathname.startsWith(seg + "/") ||
      // handle /{locale}/... prefix (en, pt, es)
      /^\/(en|pt|es)/.test(pathname) && (
        pathname.endsWith(seg) || pathname.includes(seg + "/")
      )
  );
}

function isAuthPath(pathname: string) {
  return pathname.startsWith("/auth");
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname) || isAuthPath(pathname)) {
    const response = NextResponse.next({ request: { headers: request.headers } });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cs) => {
            cs.forEach(({ name, value }) => request.cookies.set(name, value));
            cs.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && isProtectedPath(pathname)) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user && isAuthPath(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Auth pages live OUTSIDE the [locale] segment — serve them directly,
    // bypassing next-intl's locale rewriting (which would otherwise 404 them).
    if (isAuthPath(pathname)) {
      return response;
    }
    // Protected paths with a valid user fall through to next-intl below.
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
