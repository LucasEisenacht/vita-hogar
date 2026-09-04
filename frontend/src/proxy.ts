import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

function redirectWithSessionCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;

  const redirectResponse = NextResponse.redirect(redirectUrl);
  response.headers.forEach((value, key) => {
    redirectResponse.headers.set(key, value);
  });
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if (!user && pathname.startsWith("/admin")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/ingresar";
    redirectUrl.searchParams.set("next", "/admin");

    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.headers.forEach((value, key) => {
      redirectResponse.headers.set(key, value);
    });
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  if (!user && pathname.startsWith("/mi-cuenta")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/ingresar";
    redirectUrl.searchParams.set("next", "/mi-cuenta");

    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.headers.forEach((value, key) => {
      redirectResponse.headers.set(key, value);
    });
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  if (user && (pathname === "/ingresar" || pathname === "/registro")) {
    return redirectWithSessionCookies(request, response, "/mi-cuenta");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
