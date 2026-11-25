import { env, yahooRedirectUri } from "./config";

export type YahooTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  const auth = Buffer.from(`${env("YAHOO_CLIENT_ID")}:${env("YAHOO_CLIENT_SECRET")}`).toString("base64");
  const response = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
    method: "POST",
    headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store"
  });
  const data = await response.json() as TokenResponse;
  if (!response.ok || !data.access_token) throw new Error(`Yahoo token exchange failed (${response.status}): ${data.error || "unknown error"}`);
  return data;
}

export async function exchangeCode(code: string): Promise<YahooTokens> {
  const data = await requestToken(new URLSearchParams({
    grant_type: "authorization_code", code, redirect_uri: yahooRedirectUri()
  }));
  if (!data.refresh_token) throw new Error("Yahoo did not return a refresh token");
  return { access_token: data.access_token!, refresh_token: data.refresh_token, expires_at: Date.now() + (data.expires_in || 3600) * 1000 };
}

export async function refreshTokens(current: YahooTokens): Promise<YahooTokens> {
  const data = await requestToken(new URLSearchParams({grant_type: "refresh_token", refresh_token: current.refresh_token}));
  return { access_token: data.access_token!, refresh_token: data.refresh_token || current.refresh_token, expires_at: Date.now() + (data.expires_in || 3600) * 1000 };
}

export async function yahooGet(path: string, token: string): Promise<unknown> {
  if (!path.startsWith("/fantasy/v2/")) throw new Error("Invalid Fantasy API endpoint");
  const response = await fetch(`https://fantasysports.yahooapis.com${path}${path.includes("?") ? "&" : "?"}format=json`, {
    headers: {Authorization: `Bearer ${token}`, Accept: "application/json"},
    cache: "no-store"
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Yahoo Fantasy API returned ${response.status}: ${body.slice(0, 240)}`);
  try { return JSON.parse(body) as unknown; } catch { throw new Error("Yahoo response was not JSON"); }
}

// Yahoo's fantasy JSON uses alternating numeric/object keys for resource collections.
export function findAllByKey(input: unknown, desiredKey: string, limit = 200): unknown[] {
  const matches: unknown[] = [];
  const walk = (value: unknown, depth: number): void => {
    if (matches.length >= limit || depth > 20 || !value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (key === desiredKey) matches.push(child);
      walk(child, depth + 1);
    }
  };
  walk(input, 0);
  return matches;
}

export function stringsForKey(input: unknown, wanted: string, depth = 0): string[] {
  if (depth > 20 || !input || typeof input !== "object") return [];
  return Object.entries(input).flatMap(([key, value]) => key === wanted && (typeof value === "string" || typeof value === "number")
    ? [String(value)] : stringsForKey(value, wanted, depth + 1));
}

export function isFantasyLeagueKey(value: string, leagueId: string) { return new RegExp(`^\\d+\\.l\\.${leagueId}$`).test(value); }
