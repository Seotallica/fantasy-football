"use client";
import { useEffect, useMemo, useState } from "react";

type ApiData = {
  connected?: boolean; error?: string; message?: string; season?: string; leagueKey?: string;
  fetchedAt?: string; league?: unknown; standings?: unknown; teams?: unknown; matchups?: unknown;
};

function allByKey(input: unknown, key: string, limit = 300): unknown[] {
  const result: unknown[] = [];
  const scan = (v: unknown, depth: number): void => {
    if (!v || typeof v !== "object" || depth > 20 || result.length > limit) return;
    Object.entries(v).forEach(([k, child]) => { if (k === key) result.push(child); scan(child, depth+1); });
  };
  scan(input, 0);
  return result;
}
function first(input: unknown, key: string): string | undefined {
  for (const item of allByKey(input, key)) if (["string","number"].includes(typeof item)) return String(item);
}
function decodeTeams(data: unknown): Array<{key:string;name:string;manager:string;wins:string;losses:string;points:string;rank:number}> {
  const raw = allByKey(data,"team");
  const seen = new Set<string>();
  const parsed = raw.map((team) => {
    const key = first(team,"team_key") || "";
    const name = first(team,"name") || "Unknown team";
    const wins = first(team,"wins") || "—";
    const losses = first(team,"losses") || "—";
    const points = first(team,"points_for") || "—";
    const manager = first(team,"nickname") || "";
    return {key,name,wins,losses,points,manager,rank:Number(first(team,"rank") || 999)};
  }).filter((team) => { if(!team.key || seen.has(team.key)) return false; seen.add(team.key); return true; });
  return parsed.sort((a,b) => a.rank - b.rank);
}

export default function Dashboard() {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const [view, setView] = useState<"standings"|"teams"|"matchups">("standings");
  async function sync() {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard", {cache:"no-store"});
      const payload = await response.json() as ApiData;
      setData(payload);
    } catch { setData({error:"network",message:"Unable to connect to the dashboard API."}); }
    setLoading(false);
  }
  useEffect(() => { void sync(); }, []);
  const standings = useMemo(() => decodeTeams(data?.standings), [data?.standings]);
  const teams = useMemo(() => decodeTeams(data?.teams), [data?.teams]);
  const leagueName = first(data?.league,"name") || "Fantasy @ Pickleball Village";
  const myTeam = standings.find(t => t.name.toLowerCase().includes("seotallica"));
  const record = myTeam ? `${myTeam.wins}–${myTeam.losses}` : "—";
  const panel = (label:string,value:string,detail?:string) => <div className="stat"><div className="statLabel">{label}</div><div className="statValue">{value}</div>{detail && <div className="statHint">{detail}</div>}</div>;
  return <main className="shell">
    <header className="topbar"><div className="logo">S<span>⚡</span>T</div><div className="topright"><span>YAHOO FANTASY · READ ONLY</span><a href="/api/auth/logout">Disconnect</a></div></header>
    <section className="hero"><div className="eyebrow">2026 SEASON · SEOTALLICA</div><h1>Your league.<br/><em>Your advantage.</em></h1><p>Real league standings, teams and matchups from the Yahoo Fantasy Sports API. This initial release is read-only.</p></section>
    {loading ? <div className="notice">Connecting to Yahoo Fantasy…</div> : !data?.connected ? <div className="notice"><b>Connection required</b><p>{data?.message || (data?.error === "not_connected" ? "Sign in with Yahoo to authorize access to your private fantasy league." : "Your Yahoo connection needs attention.")}</p><a className="primary" href="/api/auth/login">Connect Yahoo Fantasy</a></div> : <>
      <div className="sectionHead"><div><div className="eyebrow">CONNECTED LEAGUE</div><h2>{leagueName}</h2><p className="muted">{data.leagueKey} · Synced {data.fetchedAt ? new Date(data.fetchedAt).toLocaleString() : "just now"}</p></div><button className="secondary" onClick={()=>void sync()}>↻ Refresh data</button></div>
      <div className="stats">{panel("SEOTALLICA RECORD",record,"Your current standing")}{panel("POINTS SCORED",myTeam?.points || "—","Season total")}{panel("LEAGUE RANK",myTeam?.rank && myTeam.rank < 999 ? `#${myTeam.rank}` : "—","Head-to-head seeding")}{panel("TEAMS",String(teams.length || standings.length),"League entries")}</div>
      <nav className="tabs"><button className={view === "standings"?"active":""} onClick={()=>setView("standings")}>Standings</button><button className={view === "teams"?"active":""} onClick={()=>setView("teams")}>League teams</button><button className={view === "matchups"?"active":""} onClick={()=>setView("matchups")}>Matchup data</button></nav>
      {view !== "matchups" ? <div className="tableWrap"><table><thead><tr><th>RANK</th><th>TEAM</th><th>W–L</th><th>POINTS FOR</th></tr></thead><tbody>{(view === "standings" ? standings : teams).map((team,i)=><tr key={team.key} className={team.name.toLowerCase().includes("seotallica")?"highlight":""}><td>{team.rank < 999 ? team.rank : i+1}</td><td><b>{team.name}</b>{team.manager && <div className="muted small">{team.manager}</div>}</td><td>{team.wins}–{team.losses}</td><td>{team.points}</td></tr>)}</tbody></table>{(view === "standings" ? standings : teams).length === 0 && <p className="muted inset">Yahoo returned data, but the team list could not be parsed. Use the diagnostic viewer below.</p>}</div> : <div className="tableWrap inset"><p className="muted">League scoreboard data has been fetched. This first version provides a diagnostic view of Yahoo's response while we finalize matchup parsing.</p></div>}
      <div className="diagnostics"><button className="secondary" onClick={()=>setShowRaw(!showRaw)}>{showRaw ? "Hide" : "Show"} API diagnostics</button>{showRaw && <pre>{JSON.stringify(view === "matchups" ? data.matchups : view === "teams" ? data.teams : data.standings,null,2)}</pre>}</div>
    </>}
    <footer>SEOTALLICA FANTASY INTELLIGENCE <span>v0.1 · Secure OAuth · Personal use</span></footer>
  </main>;
}
