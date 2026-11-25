import { NextRequest, NextResponse } from "next/server";
import { readSession, writeSession } from "../../../lib/session";
import { findAllByKey, isFantasyLeagueKey, refreshTokens, stringsForKey, yahooGet } from "../../../lib/yahoo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApiError = { error: string };
export async function GET(request: NextRequest) {
  let tokens = readSession(request);
  if (!tokens) return NextResponse.json<ApiError>({error:"not_connected"}, {status:401});
  try {
    let refreshed = false;
    if (tokens.expires_at < Date.now() + 90_000) { tokens = await refreshTokens(tokens); refreshed = true; }
    const requestedSeason = process.env.FANTASY_SEASON || "2026";
    const numericLeagueId = process.env.YAHOO_LEAGUE_ID || "1437515";
    const games = await yahooGet("/fantasy/v2/users;use_login=1/games;game_keys=nfl", tokens.access_token);
    const discoveredGames = findAllByKey(games, "game");
    // Discover game key for requested season, then resolve league from user's authorized account.
    const gameKeyCandidates = discoveredGames.flatMap(game => {
      const year = stringsForKey(game, "season")[0];
      return year === requestedSeason ? stringsForKey(game, "game_key") : [];
    });
    const gameKey = gameKeyCandidates.find(k => /^\d+$/.test(k));
    if (!gameKey) {
      const response = NextResponse.json({error:"game_not_found", message:`Could not identify an authorized NFL game for ${requestedSeason}.`, gameYears: discoveredGames.flatMap(g=>stringsForKey(g,"season"))});
      if (refreshed) writeSession(response, tokens);
      return response;
    }
    const leagueKey = `${gameKey}.l.${numericLeagueId}`;
    // League detail is intentionally fetched separately: invalid game keys/league permissions will return actionable errors.
    const [league, standings, teams, matchups] = await Promise.all([
      yahooGet(`/fantasy/v2/league/${leagueKey}`, tokens.access_token),
      yahooGet(`/fantasy/v2/league/${leagueKey}/standings`, tokens.access_token),
      yahooGet(`/fantasy/v2/league/${leagueKey}/teams`, tokens.access_token),
      yahooGet(`/fantasy/v2/league/${leagueKey}/scoreboard`, tokens.access_token)
    ]);
    const leagueKeys = stringsForKey(league, "league_key");
    if (!leagueKeys.some(key => isFantasyLeagueKey(key, numericLeagueId))) throw new Error("League key does not match configuration");
    const response = NextResponse.json({
      connected: true, season: requestedSeason, leagueKey, league, standings, teams, matchups,
      fetchedAt: new Date().toISOString()
    }, { headers: {"Cache-Control": "private, no-store"} });
    if (refreshed) writeSession(response, tokens);
    return response;
  } catch (error) {
    console.error("Fantasy dashboard fetch failed", error instanceof Error ? error.message : "unknown error");
    const message = error instanceof Error ? error.message : "Unknown error";
    const response = NextResponse.json({error:"fetch_failed", message}, {status:502, headers:{"Cache-Control":"private, no-store"}});
    return response;
  }
}
