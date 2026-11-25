# Seotallica Fantasy Intelligence

A private-use, read-only Yahoo Fantasy Football dashboard, built with Next.js and deployed to Vercel.

## Setup

1. Create a **Yahoo Confidential Client** with **Fantasy Sports - Read** permission and this exact redirect URL:
   `https://seotallica-fantasy-football.vercel.app/api/auth/callback/yahoo`
2. Connect this GitHub repository to Vercel using the **Next.js** framework preset.
3. Configure all required values in Vercel Settings → Environment Variables. See `.env.example`. In particular, **generate a new `SESSION_SECRET`** with `openssl rand -hex 32`. The secret is used to encrypt the Yahoo session cookie.
4. Deploy from your production branch. If variables were added after an earlier build, redeploy.
5. Open `https://seotallica-fantasy-football.vercel.app` and select **Connect Yahoo Fantasy**.

### Required environment variables

- `YAHOO_CLIENT_ID` — Yahoo application's client ID.
- `YAHOO_CLIENT_SECRET` — Yahoo application's client secret.
- `YAHOO_REDIRECT_URI` — full authorized Yahoo callback URL.
- `APP_URL` — `https://seotallica-fantasy-football.vercel.app`.
- `SESSION_SECRET` — random hex value from `openssl rand -hex 32` (do not commit or share).
- `YAHOO_LEAGUE_ID` — `1437515`.
- `FANTASY_SEASON` — `2026`.
- `FANTASY_TEAM_NAME` — `Seotallica`.

## Security notes

The app is **read-only**: it never sends transactions to Yahoo. Access/refresh tokens are stored in an AES-256-GCM encrypted, HTTP-only session cookie. No OAuth secrets or tokens belong in the repository, browser JavaScript or screenshots. This is a **personal-use prototype**, not a multi-user auth platform. If the URL is public, anybody could initiate their own Yahoo OAuth flow; the app displays only the data of the signed-in user. Before adding other users, implement proper user authorization, scoped storage and account separation.

Yahoo tokens are refreshed before expiry and the encrypted cookie is updated after successful refresh. Because the cookie carries encrypted tokens, **rotate `SESSION_SECRET` to invalidate existing sessions** if necessary. Cookies have a 14-day lifespan; reconnect after expiration.

## Yahoo API integration

The dashboard retrieves the authorized NFL game key, league overview, league standings, teams, and scoreboard via Yahoo Fantasy Sports API. Game key is discovered for the configured season; it is not assumed from the numeric league ID. Current UI shows standings and teams, with an opt-in diagnostic JSON viewer for troubleshooting.

## Development

```bash
npm install
cp .env.example .env.local
# Fill environment variables; keep .env.local private
npm run dev
```

Check TypeScript with `npm run lint` and production build with `npm run build`.

## Known limitations / next steps

- The Yahoo API payload structure should be confirmed with an authenticated live league before polishing team/scoreboard parsing.
- The app does not yet provide actionable player rankings, lineup optimization, news aggregation, or trades.
- The initial app uses encrypted stateless cookies rather than a database and only serves personal-use sessions.
- Requires the Yahoo Fantasy API app to have active approval associated with its Client ID. OAuth may succeed even when API permissions remain pending.
