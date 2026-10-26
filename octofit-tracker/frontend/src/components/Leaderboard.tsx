import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };
type Response = { leaderboard: Entry[] };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Entry[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { getJson<Response>('/api/leaderboard').then((data) => setLeaderboard(data.leaderboard)).catch(() => setError(true)); }, []);
  return <CapabilityCard title="Leaderboard" description="Compare team point totals.">
    {error ? <p role="alert">Unable to load leaderboard.</p> : leaderboard === null ? <p role="status">Loading leaderboard...</p> : leaderboard.length === 0 ? <p>No leaderboard rankings</p> : <ol>{leaderboard.map((entry) => <li key={`${entry.rank}-${entry.teamName}`}>{entry.teamName}: {entry.totalPoints} points</li>)}</ol>}
  </CapabilityCard>;
}
