export const legacyKeys = {
  profile: 'ravitoai-profile-v1',
  projects: 'ravitoai-projects-v1',
  equipment: 'ravitoai-equipment-v1',
  hydration: 'ravitoai-hydration-v1',
  strava: 'ravitoai-strava-v1',
  stravaActivities: 'ravitoai-strava-activities-v1',
  postSession: 'ravitoai-post-session-v1',
} as const;

export function readLegacy<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLegacy<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}
