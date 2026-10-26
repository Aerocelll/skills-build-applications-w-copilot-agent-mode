import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members?: string[] };
type Response = { teams: Team[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { getJson<Response>('/api/teams').then((data) => setTeams(data.teams)).catch(() => setError(true)); }, []);
  return <CapabilityCard title="Teams" description="Manage teams and members.">
    {error ? <p role="alert">Unable to load teams.</p> : teams === null ? <p role="status">Loading teams...</p> : teams.length === 0 ? <p>No teams</p> : <ul>{teams.map((team, index) => <li key={index}>{team.name}{team.members?.length ? ` (${team.members.length} members)` : ''}</li>)}</ul>}
  </CapabilityCard>;
}
