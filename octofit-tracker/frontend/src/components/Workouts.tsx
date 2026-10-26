import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; reason?: string };
type Response = { suggestions: Workout[] };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { getJson<Response>('/api/workouts/suggestions/mona%40example.com').then((data) => setSuggestions(data.suggestions)).catch(() => setError(true)); }, []);
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
    {error ? <p role="alert">Unable to load workout suggestions.</p> : suggestions === null ? <p role="status">Loading workouts...</p> : suggestions.length === 0 ? <p>No workout suggestions</p> : <ul>{suggestions.map((workout, index) => <li key={index}><strong>{workout.title}</strong>{workout.reason ? ` - ${workout.reason}` : ''}</li>)}</ul>}
  </CapabilityCard>;
}
