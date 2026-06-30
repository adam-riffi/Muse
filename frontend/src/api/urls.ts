import { API_BASE } from './config';

// Pure URL builders (no network). Safe for the UI layer to import directly — unlike the network
// client, which only the state layer should touch.
export function thumbnailUrl(id: string): string {
  return `${API_BASE}/image/${id}/thumbnail`;
}
