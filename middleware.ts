import { NextResponse, type NextRequest } from "next/server";
import { canAccessGm, canAccessPlay, getSessionFromRequest } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  const session = await getSessionFromRequest(request, response);

  if (pathname.startsWith("/gm") && pathname !== "/gm/login") {
    if (!canAccessGm(session.role)) {
      return NextResponse.redirect(new URL("/gm/login", request.url));
    }
  }

  if (pathname.startsWith("/play") && pathname !== "/play/login") {
    if (!canAccessPlay(session.role)) {
      return NextResponse.redirect(new URL("/play/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/gm/:path*", "/play/:path*"],
};
