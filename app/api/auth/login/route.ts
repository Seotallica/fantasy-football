import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { appUrl, env, oauthStateCookie, yahooRedirectUri } from "../../../../lib/config";

export const runtime = "nodejs";
export async function GET() {
  try {
    const state = randomBytes(24).toString("base64url");
    const url = new URL("https://api.login.yahoo.com/oauth2/request_auth");
    url.searchParams.set("client_id", env("YAHOO_CLIENT_ID"));
    url.searchParams.set("redirect_uri", yahooRedirectUri());
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    // Fantasy Sports - Read is configured on the Yahoo developer application.
    const response = NextResponse.redirect(url);
    response.cookies.set(oauthStateCookie, state, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/?error=configuration", appUrl()));
  }
}
