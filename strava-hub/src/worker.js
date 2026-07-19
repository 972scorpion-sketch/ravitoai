const STRAVA_AUTH = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN = 'https://www.strava.com/api/v3/oauth/token';
const STRAVA_API = 'https://www.strava.com/api/v3';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      if (url.pathname === '/health') return json({ ok: true, service: 'RavitoAI Hub' }, 200, cors);
      if (url.pathname === '/auth/strava') return beginAuth(url, env);
      if (url.pathname === '/auth/strava/callback') return finishAuth(url, env);
      if (url.pathname === '/api/strava/status') return withSession(request, env, cors, status);
      if (url.pathname === '/api/strava/sync') return withSession(request, env, cors, sync);
      if (url.pathname === '/api/strava/disconnect' && request.method === 'POST') return withSession(request, env, cors, disconnect);
      return json({ error: 'Route inconnue' }, 404, cors);
    } catch (error) {
      return json({ error: error.message || 'Erreur serveur' }, 500, cors);
    }
  }
};

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.APP_ORIGIN || '').split(',').map(v => v.trim()).filter(Boolean);
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin'
  };
}

async function beginAuth(url, env) {
  const returnTo = url.searchParams.get('return_to') || env.APP_ORIGIN;
  if (!returnTo || !returnTo.startsWith(env.APP_ORIGIN)) throw new Error('Adresse de retour refusée');
  const state = crypto.randomUUID();
  await env.STRAVA_KV.put(`state:${state}`, returnTo, { expirationTtl: 600 });
  const callback = `${url.origin}/auth/strava/callback`;
  const target = new URL(STRAVA_AUTH);
  target.searchParams.set('client_id', env.STRAVA_CLIENT_ID);
  target.searchParams.set('redirect_uri', callback);
  target.searchParams.set('response_type', 'code');
  target.searchParams.set('approval_prompt', 'auto');
  target.searchParams.set('scope', 'read,activity:read_all,profile:read_all');
  target.searchParams.set('state', state);
  return Response.redirect(target.toString(), 302);
}

async function finishAuth(url, env) {
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const returnTo = state ? await env.STRAVA_KV.get(`state:${state}`) : null;
  if (!returnTo) return new Response('État OAuth expiré ou invalide.', { status: 400 });
  await env.STRAVA_KV.delete(`state:${state}`);
  if (error || !code) return Response.redirect(`${returnTo}#strava_error=${encodeURIComponent(error || 'access_denied')}`, 302);

  const tokenResponse = await fetch(STRAVA_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    })
  });
  if (!tokenResponse.ok) throw new Error(`Échange OAuth refusé (${tokenResponse.status})`);
  const token = await tokenResponse.json();
  const athleteId = String(token.athlete.id);
  await env.STRAVA_KV.put(`token:${athleteId}`, JSON.stringify(token));
  const session = crypto.randomUUID() + crypto.randomUUID();
  await env.STRAVA_KV.put(`session:${session}`, athleteId, { expirationTtl: 60 * 60 * 24 * 180 });
  return Response.redirect(`${returnTo}#strava_session=${encodeURIComponent(session)}`, 302);
}

async function withSession(request, env, cors, handler) {
  const auth = request.headers.get('Authorization') || '';
  const session = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const athleteId = session ? await env.STRAVA_KV.get(`session:${session}`) : null;
  if (!athleteId) return json({ error: 'Session Strava absente ou expirée' }, 401, cors);
  return handler({ request, env, cors, athleteId, session });
}

async function freshToken(env, athleteId) {
  const raw = await env.STRAVA_KV.get(`token:${athleteId}`);
  if (!raw) throw new Error('Connexion Strava introuvable');
  let token = JSON.parse(raw);
  if (Number(token.expires_at) > Math.floor(Date.now() / 1000) + 3600) return token;
  const response = await fetch(STRAVA_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token
    })
  });
  if (!response.ok) throw new Error(`Actualisation Strava refusée (${response.status})`);
  const refreshed = await response.json();
  token = { ...token, ...refreshed };
  await env.STRAVA_KV.put(`token:${athleteId}`, JSON.stringify(token));
  return token;
}

async function stravaGet(path, accessToken) {
  const response = await fetch(`${STRAVA_API}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Strava API ${response.status}`);
  return response.json();
}

async function status({ env, cors, athleteId }) {
  const token = await freshToken(env, athleteId);
  return json({ connected: true, athlete: { id: token.athlete?.id, firstname: token.athlete?.firstname, lastname: token.athlete?.lastname } }, 200, cors);
}

async function sync({ env, cors, athleteId }) {
  const token = await freshToken(env, athleteId);
  const [athlete, activities] = await Promise.all([
    stravaGet('/athlete', token.access_token),
    stravaGet('/athlete/activities?per_page=30&page=1', token.access_token)
  ]);
  const cleanedActivities = activities.map(a => ({
    id: a.id,
    name: a.name,
    sport_type: a.sport_type,
    start_date: a.start_date,
    distance_km: Math.round((a.distance / 1000) * 100) / 100,
    moving_time: a.moving_time,
    elapsed_time: a.elapsed_time,
    elevation_m: a.total_elevation_gain,
    average_heartrate: a.average_heartrate || null,
    max_heartrate: a.max_heartrate || null,
    gear_id: a.gear_id || null
  }));
  const shoes = (athlete.shoes || []).map(s => ({ id: s.id, name: s.name, distance_km: Math.round((s.distance / 1000) * 10) / 10, primary: Boolean(s.primary), retired: Boolean(s.retired) }));
  return json({ synced_at: new Date().toISOString(), athlete: { id: athlete.id, firstname: athlete.firstname, lastname: athlete.lastname }, activities: cleanedActivities, shoes }, 200, cors);
}

async function disconnect({ env, cors, athleteId, session }) {
  const token = await freshToken(env, athleteId);
  await fetch('https://www.strava.com/oauth/revoke', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${env.STRAVA_CLIENT_ID}:${env.STRAVA_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ token: token.refresh_token, token_type_hint: 'refresh_token' })
  });
  await Promise.all([env.STRAVA_KV.delete(`token:${athleteId}`), env.STRAVA_KV.delete(`session:${session}`)]);
  return json({ connected: false }, 200, cors);
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
