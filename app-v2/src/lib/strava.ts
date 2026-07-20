import { legacyKeys, readLegacy, writeLegacy } from './legacyStorage';

export const STRAVA_HUB = 'https://divine-grass-d74fravitoai-hub.972-scorpion.workers.dev';

export type StravaState = {
  connected?: boolean;
  athleteName?: string;
  activityCount?: number;
  shoeCount?: number;
  syncedAt?: string;
};

export type StravaActivity = {
  id: string | number;
  name?: string;
  date?: string;
  distanceKm?: number;
};

export function getStravaState(): StravaState {
  return readLegacy<StravaState>(legacyKeys.strava, {});
}

export function getStravaActivities(): StravaActivity[] {
  return readLegacy<StravaActivity[]>(legacyKeys.stravaActivities, []);
}

export async function syncStrava(): Promise<{ state: StravaState; activities: StravaActivity[] }> {
  const response = await fetch(`${STRAVA_HUB}/strava/sync`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await response.json();

  if (response.status === 401 || !data.connected) {
    window.location.href = data.loginUrl || `${STRAVA_HUB}/strava/login`;
    throw new Error('Connexion Strava requise');
  }
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Synchronisation Strava impossible');
  }

  const activities = (data.activities || []) as StravaActivity[];
  const athleteName = [data.athlete?.firstname, data.athlete?.lastname].filter(Boolean).join(' ');
  const state: StravaState = {
    connected: true,
    athleteName,
    activityCount: activities.length,
    shoeCount: (data.shoes || []).length,
    syncedAt: data.syncedAt || new Date().toISOString(),
  };

  writeLegacy(legacyKeys.stravaActivities, activities);
  writeLegacy(legacyKeys.strava, state);
  return { state, activities };
}
