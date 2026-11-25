export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}
export function appUrl() {
  return process.env.APP_URL || "https://seotallica-fantasy-football.vercel.app";
}
export function yahooRedirectUri() {
  return process.env.YAHOO_REDIRECT_URI || `${appUrl()}/api/auth/callback/yahoo`;
}
export const sessionCookie = "seotallica_session";
export const oauthStateCookie = "seotallica_oauth_state";
