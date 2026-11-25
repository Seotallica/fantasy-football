import { NextRequest, NextResponse } from "next/server";
import { oauthStateCookie, sessionCookie } from "./config";
import { seal, unseal } from "./crypto";
import { YahooTokens } from "./yahoo";

export function readSession(request: NextRequest): YahooTokens | null {
  const raw = request.cookies.get(sessionCookie)?.value;
  if (!raw) return null;
  const session = unseal<YahooTokens>(raw);
  return session && session.access_token && session.refresh_token && session.expires_at ? session : null;
}
export function writeSession(response: NextResponse, tokens: YahooTokens) {
  response.cookies.set(sessionCookie, seal(tokens), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14
  });
}
export function clearSession(response: NextResponse) {
  response.cookies.delete(sessionCookie);
  response.cookies.delete(oauthStateCookie);
}
