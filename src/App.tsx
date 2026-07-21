import { useEffect, useState, type ComponentType } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  BellSimple, CalendarBlank, CaretRight, Drop, House, Lightning,
  Package, PersonSimpleRun, ShoppingBag, Sparkle, UserCircle,
} from '@phosphor-icons/react'
import { Button } from './components/ui/button'

type IconType = ComponentType<{ size?: number; weight?: 'regular' | 'fill' | 'duotone'; className?: string }>

const tabs: { path: string; label: string; icon: IconType }[] = [
  { path: '/accueil', label: 'Accueil', icon: House },
  { path: '/activites', label: 'Activités', icon: PersonSimpleRun },
  { path: '/nutrition', label: 'Nutrition', icon: Drop },
  { path: '/produits', label: 'Produits', icon: ShoppingBag },
  { path: '/univers', label: 'Mon Univers', icon: UserCircle },
]

function Brand({ large = false }: { large?: boolean }) {
  return <div className={`brand ${large ? 'brand--large' : ''}`} aria-label="RavitoAI">
    <img src="/assets/ravitoai-logo.png" alt="RavitoAI" />
  </div>
}

function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onDone, 2200); return () => clearTimeout(timer) }, [onDone])
  return <motion.div className="splash" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: .55 }}>
    <motion.img
      src="/assets/splash-official.jpg"
      alt="RavitoAI — Trail, running et Hyrox"
      initial={{ scale: 1.025 }}
      animate={{ scale: 1 }}
      transition={{ duration: 2.2, ease: 'easeOut' }}
    />
  </motion.div>
}

function AppLayout() {
  const location = useLocation()
  return <div className="app-shell">
    <aside className="desktop-rail">
      <Brand />
      <p className="rail-tagline">Ton assistant nutrition<br />pour performer plus loin.</p>
      <Navigation />
      <div className="rail-profile"><span>AS</span><div><strong>Scorpion</strong><small>Profil sportif</small></div></div>
    </aside>
    <main className="main-content">
      <header className="mobile-header"><Brand /><button aria-label="Notifications"><BellSimple size={22} /><i>2</i></button></header>
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} className="page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: .22 }}>
          <Routes location={location}>
            <Route path="/accueil" element={<Home />} />
            <Route path="/activites" element={<Placeholder icon={PersonSimpleRun} kicker="TES SORTIES" title="Activités" copy="Retrouve bientôt toutes tes sorties, tes progrès et tes prochains défis." />} />
            <Route path="/nutrition" element={<Placeholder icon={Drop} kicker="TON ÉNERGIE" title="Nutrition" copy="Ton espace nutrition arrive bientôt, pensé pour chaque moment de l’effort." />} />
            <Route path="/produits" element={<Placeholder icon={Package} kicker="TES ESSENTIELS" title="Produits" copy="Gels, boissons et barres seront bientôt réunis dans ta sélection." />} />
            <Route path="/univers" element={<Placeholder icon={UserCircle} kicker="TON TERRAIN" title="Mon Univers" copy="Courses, objectifs et matériel prendront bientôt place dans ton univers." />} />
            <Route path="*" element={<Navigate to="/accueil" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </main>
    <div className="mobile-nav"><Navigation /></div>
  </div>
}

function Navigation() {
  return <nav className="navigation" aria-label="Navigation principale">
    {tabs.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
      {({ isActive }) => <><span className="nav-item__icon"><Icon size={22} weight={isActive ? 'duotone' : 'regular'} /></span><span>{label}</span></>}
    </NavLink>)}
  </nav>
}

function Home() {
  return <div className="home">
    <section className="welcome-row"><div><p className="hello">Bonjour Scorpion <span>👋</span></p><p className="muted">Prêt pour de nouvelles aventures ?</p></div><button className="notification" aria-label="Notifications"><BellSimple size={23} /><i>2</i></button></section>
    <section className="race-card glass-card">
      <div className="race-card__aurora" />
      <div className="race-card__head"><span>PROCHAINE COURSE</span><CalendarBlank size={21} /></div>
      <h1>20 km de Paris</h1>
      <div className="race-date"><span>5 octobre 2026</span><strong>J-76</strong></div>
      <div className="race-stats"><div><span>Objectif</span><strong>1h32’00’’</strong></div><CaretRight /><div><span>Allure cible</span><strong>4’36’’/km</strong></div><CaretRight /></div>
    </section>
    <div className="section-title"><h2>Aujourd’hui</h2><span>Vue d’ensemble</span></div>
    <section className="metrics">
      <Metric icon={Drop} color="blue" label="Hydratation" value="1.2 L" sub="/ 2.0 L" progress="60%" />
      <Metric icon={Lightning} color="yellow" label="Énergie" value="158 g" sub="/ 320 g" progress="49%" />
      <Metric icon={Sparkle} color="green" label="Forme" value="78%" sub="Bonne forme" progress="78%" />
    </section>
    <section className="activity-card glass-card">
      <div><span>DERNIÈRE ACTIVITÉ</span><small>Hier</small></div><h3>Sortie longue</h3>
      <div className="activity-card__body"><p><strong>18,7 km</strong><span>1h37’42’’</span><span>154 bpm</span></p><svg viewBox="0 0 110 55" role="img" aria-label="Tracé de la dernière sortie"><polyline points="2,49 15,47 24,35 34,40 45,27 55,21 64,14 76,18 88,4 106,1" /></svg></div>
    </section>
    <section className="tip-card"><span><Sparkle size={20} weight="duotone" /></span><div><small>CONSEIL DU JOUR</small><p>Garde tes deux dernières sorties longues régulières et faciles. La fraîcheur fera la différence.</p></div></section>
    <Button className="cta" size="lg"><Lightning size={19} weight="fill" /> Préparer ma prochaine sortie</Button>
  </div>
}

function Metric({ icon: Icon, color, label, value, sub, progress }: { icon: IconType; color: string; label: string; value: string; sub: string; progress: string }) {
  return <article className="metric glass-card"><div className={`metric__label ${color}`}><Icon size={15} weight="duotone" /> {label}</div><strong>{value}</strong><span>{sub}</span><i><b style={{ width: progress }} /></i></article>
}

function Placeholder({ icon: Icon, kicker, title, copy }: { icon: IconType; kicker: string; title: string; copy: string }) {
  return <section className="placeholder">
    <motion.div className="placeholder__icon" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}><Icon size={42} weight="duotone" /></motion.div>
    <p>{kicker}</p><h1>{title}</h1><span>{copy}</span><div className="soon"><Sparkle size={14} /> Bientôt disponible</div>
  </section>
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  return <><AnimatePresence>{showSplash && <Splash onDone={() => setShowSplash(false)} />}</AnimatePresence><AppLayout /></>
}
