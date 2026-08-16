import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export type Role = "gm" | "player";

export interface SessionData {
  role?: Role;
}

function requireSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to a string of at least 32 characters");
  }
  return secret;
}

export const sessionOptions = {
  get password() {
    return requireSecret();
  },
  cookieName: "kudos_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 365, // shared trusted devices — keep signed in a long time
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function getSessionFromRequest(
  request: NextRequest,
  response: NextResponse,
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(request, response, sessionOptions);
}

export function canAccessGm(role?: Role): boolean {
  return role === "gm";
}

export function canAccessPlay(role?: Role): boolean {
  return role === "gm" || role === "player";
}

/** Defense in depth for Server Actions — middleware already gates the page routes. */
export async function requireGm(): Promise<void> {
  const session = await getSession();
  if (!canAccessGm(session.role)) {
    throw new Error("Not authorized: gamemaster session required");
  }
}

/** Defense in depth for actions available from the shared family player view. */
export async function requirePlay(): Promise<void> {
  const session = await getSession();
  if (!canAccessPlay(session.role)) {
    throw new Error("Not authorized: player session required");
  }
}
