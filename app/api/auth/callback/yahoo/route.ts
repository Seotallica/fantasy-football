import { NextRequest, NextResponse } from "next/server";
import { appUrl, oauthStateCookie } from "../../../../../lib/config";
import { exchangeCode } from "../../../../../lib/yahoo";
import { writeSession } from "../../../../../lib/session";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get(oauthStateCookie)?.value;
  const code = request.nextUrl.searchParams.get("code");
  if (!state || !expected || state !== expected || !code) return NextResponse.redirect(new URL("/?error=authorization", appUrl()));
  try {
    const tokens = await exchangeCode(code);
    const response = NextResponse.redirect(new URL("/", appUrl()));
    writeSession(response, tokens);
    response.cookies.delete(oauthStateCookie);
    return response;
  } catch (error) {
    console.error("Yahoo OAuth callback failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.redirect(new URL("/?error=exchange", appUrl()));
  }
}
