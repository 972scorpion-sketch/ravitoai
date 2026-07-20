import { useMemo, useState } from 'react';
import { Activity, Apple, Bot, CalendarDays, Home, RefreshCw, Settings2 } from 'lucide-react';
import { getStravaActivities, getStravaState, syncStrava, type StravaActivity } from './lib/strava';

const tabs = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'activities', label: 'Activités', icon: Activity },
  { id: 'plan', label: 'Plan', icon: CalendarDays },
  { id: 'coach', label: 'Coach IA', icon: Bot },
  { id: 'universe', label: 'Univers', icon: Settings2 },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [stravaState, setStravaState] = useState(getStravaState());
  const [activities, setActivities] = useState<StravaActivity[]>(getStravaActivities());
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const latestActivities = useMemo(() => activities.slice(0, 4), [activities]);

  async function handleStrava() {
    if (!stravaState.connected) {
      window.location.href = 'https://divine-grass-d74fravitoai-hub.972-scorpion.workers.dev/strava/login';
      return;
    }
    setSyncing(true);
    setMessage('');
    try {
      const result = await syncStrava();
      setStravaState(result.state);
      setActivities(result.activities);
      setMessage('Synchronisation terminée.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Synchronisation impossible.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="app-frame">
      <header className="topbar">
        <div>
          <span className="version-pill">RAVITOAI · v0.1 DEV</span>
          <h1>Ton copilote ravitaillement</h1>
          <p>Une nouvelle base graphique, sans perdre les données ni la connexion Strava existantes.</p>
        </div>
        <button className="avatar" aria-label="Profil"><Apple size={20} /></button>
      </header>

      <main>
        {activeTab === 'home' && (
          <div className="dashboard">
            <section className="hero-card">
              <div>
                <span className="eyebrow">PROCHAINE ÉTAPE</span>
                <h2>Préparer une stratégie qui apprend de tes séances</h2>
                <p>Le nouveau socle React reprend progressivement le calculateur, ton univers et l’historique existants.</p>
              </div>
              <button className="primary" onClick={() => setActiveTab('plan')}>Créer un plan</button>
            </section>

            <section className="metric-grid">
              <article className="metric-card"><span>Activités Strava</span><strong>{activities.length}</strong><small>importées localement</small></article>
              <article className="metric-card"><span>Connexion</span><strong>{stravaState.connected ? 'Active' : 'À connecter'}</strong><small>{stravaState.athleteName || 'Compte Strava'}</small></article>
              <article className="metric-card"><span>Version</span><strong>0.1</strong><small>socle graphique</small></article>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div><span className="eyebrow">STRAVA</span><h3>Synchronisation conservée</h3></div>
                <button className="secondary" onClick={handleStrava} disabled={syncing}>
                  <RefreshCw size={18} className={syncing ? 'spin' : ''} />
                  {stravaState.connected ? 'Synchroniser' : 'Connecter'}
                </button>
              </div>
              {message && <p className="status-message">{message}</p>}
              <div className="activity-list">
                {latestActivities.length ? latestActivities.map((activity) => (
                  <article key={activity.id} className="activity-row">
                    <div className="activity-icon"><Activity size={18} /></div>
                    <div><strong>{activity.name || 'Course à pied'}</strong><span>{activity.date ? new Date(activity.date).toLocaleDateString('fr-FR') : 'Date inconnue'}</span></div>
                    <b>{Number(activity.distanceKm || 0).toFixed(1)} km</b>
                  </article>
                )) : <p className="empty-state">Aucune activité disponible pour le moment.</p>}
              </div>
            </section>
          </div>
        )}

        {activeTab !== 'home' && (
          <section className="panel placeholder">
            <span className="eyebrow">MIGRATION EN COURS</span>
            <h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
            <p>Cet écran sera migré sans effacer les données de la version actuelle.</p>
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Navigation principale">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
