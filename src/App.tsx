import { useEffect, useMemo, useState, type ComponentType, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  Basket, BellSimple, CalendarBlank, CaretRight, Check, Drop, House, Lightning, MapPin, MagnifyingGlass,
  Package, PencilSimple, PersonSimpleRun, Plus, ShoppingBag, Sparkle, Star, Trash, UserCircle, WarningCircle, X,
} from '@phosphor-icons/react'
import { Button } from './components/ui/button'

type IconType = ComponentType<{ size?: number; weight?: 'regular' | 'fill' | 'duotone'; className?: string }>
type Sport = 'running' | 'trail' | 'cycling' | 'hiking'
type PlannedOuting = { id: string; date: string; time: string; sport: Sport; distance: number; duration: string; elevation: number; pace: string; location: string; title: string; goal: string; notes: string }
type OutingDraft = Omit<PlannedOuting, 'id'>
type Weather = 'clear' | 'cloudy' | 'rain' | 'humid'
type EffortIntensity = 'easy' | 'moderate' | 'hard'
type SweatRate = 'low' | 'average' | 'high'
type DigestiveSensitivity = 'sensitive' | 'normal' | 'robust'
type ProductCategory = 'gel' | 'drink' | 'bar' | 'compote' | 'electrolyte'
type FuelProduct = { id: string; name: string; brand: string; category: ProductCategory; carbs: number; sodium: number; caffeine: number; volume: number; portion: string; allergens: string; quantity: number; expiry: string; favorite: boolean; poorTolerance: boolean }
type OrderItem = { productId: string; quantity: number }
type ProductSelection = { productId: string; portions: number }
type NutritionPlan = { id: string; outingId: string; weather: Weather; temperature: number; intensity: EffortIntensity; sweat: SweatRate; digestion: DigestiveSensitivity; waterPerHour: number; carbsPerHour: number; sodiumPerHour: number; productSelection?: ProductSelection[]; updatedAt: string }

const STORAGE_KEY = 'ravitoai:planned-outings:v1'
const NUTRITION_STORAGE_KEY = 'ravitoai:nutrition-plans:v1'
const PRODUCT_STORAGE_KEY = 'ravitoai:products:v1'
const ORDER_STORAGE_KEY = 'ravitoai:products-to-order:v1'
const seedOuting: PlannedOuting = { id: 'paris-20k', date: '2026-10-05', time: '09:00', sport: 'running', distance: 20, duration: '01:32', elevation: 120, pace: '4:36', location: 'Paris', title: '20 km de Paris', goal: 'Finir en moins de 1h35', notes: '' }
const emptyDraft = (): OutingDraft => ({ date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), time: '08:00', sport: 'running', distance: 10, duration: '01:00', elevation: 0, pace: '6:00', location: '', title: '', goal: '', notes: '' })
const sportLabels: Record<Sport, string> = { running: 'Course', trail: 'Trail', cycling: 'Vélo', hiking: 'Randonnée' }
const weatherLabels: Record<Weather, string> = { clear: 'Ensoleillé', cloudy: 'Nuageux', rain: 'Pluie', humid: 'Chaud et humide' }
const intensityLabels: Record<EffortIntensity, string> = { easy: 'Facile', moderate: 'Modérée', hard: 'Élevée' }
const sweatLabels: Record<SweatRate, string> = { low: 'Faible', average: 'Moyenne', high: 'Importante' }
const digestionLabels: Record<DigestiveSensitivity, string> = { sensitive: 'Sensible', normal: 'Normale', robust: 'Bonne tolérance' }
const categoryLabels: Record<ProductCategory, string> = { gel: 'Gels', drink: 'Boissons', bar: 'Barres', compote: 'Compotes', electrolyte: 'Électrolytes' }
const seedProducts: FuelProduct[] = [
  { id: 'seed-gel', name: 'Gel Endurance', brand: 'Ravito Lab', category: 'gel', carbs: 25, sodium: 100, caffeine: 0, volume: 0, portion: '1 sachet de 40 g', allergens: '', quantity: 8, expiry: '2027-03-01', favorite: true, poorTolerance: false },
  { id: 'seed-drink', name: 'Drink Mix Citron', brand: 'Ravito Lab', category: 'drink', carbs: 40, sodium: 500, caffeine: 0, volume: 500, portion: '1 dose pour 500 ml', allergens: '', quantity: 6, expiry: '2027-05-15', favorite: true, poorTolerance: false },
  { id: 'seed-bar', name: 'Barre Avoine Cacao', brand: 'Summit Fuel', category: 'bar', carbs: 32, sodium: 140, caffeine: 0, volume: 0, portion: '1 barre de 50 g', allergens: 'Gluten, fruits à coque', quantity: 4, expiry: '2026-12-10', favorite: false, poorTolerance: false },
  { id: 'seed-compote', name: 'Compote Énergie Pomme', brand: 'Trail Bio', category: 'compote', carbs: 20, sodium: 40, caffeine: 0, volume: 90, portion: '1 gourde de 90 g', allergens: '', quantity: 5, expiry: '2026-11-20', favorite: false, poorTolerance: false },
  { id: 'seed-electrolyte', name: 'Caps Électrolytes', brand: 'Ravito Lab', category: 'electrolyte', carbs: 0, sodium: 250, caffeine: 0, volume: 0, portion: '1 capsule', allergens: '', quantity: 12, expiry: '2028-01-01', favorite: true, poorTolerance: false },
]

const tabs: { path: string; label: string; icon: IconType }[] = [
  { path: '/accueil', label: 'Accueil', icon: House }, { path: '/activites', label: 'Activités', icon: PersonSimpleRun },
  { path: '/nutrition', label: 'Nutrition', icon: Drop }, { path: '/produits', label: 'Produits', icon: ShoppingBag },
  { path: '/univers', label: 'Mon Univers', icon: UserCircle },
]

const outingDate = (outing: PlannedOuting) => new Date(`${outing.date}T${outing.time}:00`)
const formatDate = (outing: PlannedOuting) => new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }).format(outingDate(outing))
const formatDuration = (duration: string) => { const [hours, minutes] = duration.split(':').map(Number); return hours ? `${hours}h${String(minutes).padStart(2, '0')}` : `${minutes} min` }
const durationHours = (duration: string) => { const [hours = 0, minutes = 0] = duration.split(':').map(Number); return hours + minutes / 60 }
const formatPace = (minutesPerKm: number) => { const safe = Math.max(0, minutesPerKm); let minutes = Math.floor(safe); let seconds = Math.round((safe - minutes) * 60); if (seconds === 60) { minutes += 1; seconds = 0 } return `${minutes}:${String(seconds).padStart(2, '0')}` }
const calculateTargetPace = (sport: Sport, distance: number, duration: string) => {
  const hours = durationHours(duration)
  if (!distance || !hours) return sport === 'cycling' ? '0' : '0:00'
  return sport === 'cycling' ? (distance / hours).toFixed(1) : formatPace(hours * 60 / distance)
}
const calculateEffortIndicator = (sport: Sport, distance: number, duration: string, elevation: number) => {
  const hours = durationHours(duration)
  if (!distance || !hours) return ''
  if (sport === 'cycling') return `${Math.round(elevation / hours)} m D+/h prévus`
  const elevationDivisor = sport === 'running' ? 200 : sport === 'trail' ? 100 : 125
  const effortDistance = distance + elevation / elevationDivisor
  return `${formatPace(hours * 60 / effortDistance)}/km en allure-effort · ${effortDistance.toFixed(1)} km-effort`
}
const formatWeek = (outing: PlannedOuting) => { const date = outingDate(outing); const monday = new Date(date); monday.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(monday) }
const normalizeOuting = (outing: Partial<PlannedOuting>): PlannedOuting => ({ ...seedOuting, ...outing, sport: ['running', 'trail', 'cycling', 'hiking'].includes(outing.sport ?? '') ? outing.sport as Sport : 'running', title: outing.title?.trim() || `${sportLabels[(outing.sport as Sport) || 'running']} · ${outing.location?.trim() || 'À définir'}`, goal: outing.goal ?? '', notes: outing.notes ?? '' })

function usePlannedOutings() {
  const [outings, setOutings] = useState<PlannedOuting[]>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? (JSON.parse(saved) as Partial<PlannedOuting>[]).map(normalizeOuting) : [seedOuting] } catch { return [seedOuting] }
  })
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(outings)) }, [outings])
  return { outings, setOutings }
}

function useNutritionPlans() {
  const [plans, setPlans] = useState<NutritionPlan[]>(() => {
    try { const saved = localStorage.getItem(NUTRITION_STORAGE_KEY); return saved ? JSON.parse(saved) as NutritionPlan[] : [] } catch { return [] }
  })
  useEffect(() => { localStorage.setItem(NUTRITION_STORAGE_KEY, JSON.stringify(plans)) }, [plans])
  return { plans, setPlans }
}

function useProducts() {
  const [products, setProducts] = useState<FuelProduct[]>(() => {
    try { const saved = localStorage.getItem(PRODUCT_STORAGE_KEY); return saved ? JSON.parse(saved) as FuelProduct[] : seedProducts } catch { return seedProducts }
  })
  useEffect(() => { localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products)) }, [products])
  return { products, setProducts }
}

function useOrderList() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => {
    try { const saved = localStorage.getItem(ORDER_STORAGE_KEY); return saved ? JSON.parse(saved) as OrderItem[] : [] } catch { return [] }
  })
  useEffect(() => { localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orderItems)) }, [orderItems])
  return { orderItems, setOrderItems }
}

function Brand() { return <div className="brand" aria-label="RavitoAI"><img src="/assets/ravitoai-logo.png" alt="RavitoAI" /></div> }

function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onDone, 2200); return () => clearTimeout(timer) }, [onDone])
  return <motion.div className="splash" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: .55 }}><motion.img src="/assets/splash-official.jpg" alt="RavitoAI — Trail, running et Hyrox" initial={{ scale: 1.025 }} animate={{ scale: 1 }} transition={{ duration: 2.2, ease: 'easeOut' }} /></motion.div>
}

function AppLayout() {
  const location = useLocation()
  return <div className="app-shell"><aside className="desktop-rail"><Brand /><p className="rail-tagline">Ton assistant nutrition<br />pour performer plus loin.</p><Navigation /><div className="rail-profile"><span>AS</span><div><strong>Scorpion</strong><small>Profil sportif</small></div></div></aside><main className="main-content"><header className="mobile-header"><Brand /><button aria-label="Notifications"><BellSimple size={22} /><i>2</i></button></header><AnimatePresence mode="wait"><motion.div key={location.pathname} className="page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: .22 }}><Routes location={location}><Route path="/accueil" element={<Home />} /><Route path="/activites" element={<Placeholder icon={PersonSimpleRun} kicker="TES SORTIES" title="Activités" copy="Retrouve bientôt toutes tes sorties, tes progrès et tes prochains défis." />} /><Route path="/nutrition" element={<NutritionPage />} /><Route path="/produits" element={<ProductsPage />} /><Route path="/univers" element={<Placeholder icon={UserCircle} kicker="TON TERRAIN" title="Mon Univers" copy="Courses, objectifs et matériel prendront bientôt place dans ton univers." />} /><Route path="*" element={<Navigate to="/accueil" replace />} /></Routes></motion.div></AnimatePresence></main><div className="mobile-nav"><Navigation /></div></div>
}

function Navigation() { return <nav className="navigation" aria-label="Navigation principale">{tabs.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>{({ isActive }) => <><span className="nav-item__icon"><Icon size={22} weight={isActive ? 'duotone' : 'regular'} /></span><span>{label}</span></>}</NavLink>)}</nav> }

function Home() {
  const navigate = useNavigate()
  const { outings, setOutings } = usePlannedOutings()
  const [dialog, setDialog] = useState<'form' | 'agenda' | 'nutrition' | null>(null)
  const [editing, setEditing] = useState<PlannedOuting | null>(null)
  const [preparedOuting, setPreparedOuting] = useState<PlannedOuting | null>(null)
  const futureOutings = useMemo(() => outings.filter(item => outingDate(item).getTime() > Date.now()).sort((a, b) => outingDate(a).getTime() - outingDate(b).getTime()), [outings])
  const next = futureOutings[0]
  const save = (draft: OutingDraft) => {
    if (editing) {
      const updated = { ...draft, id: editing.id }
      setOutings(items => items.map(item => item.id === editing.id ? updated : item))
      setEditing(null); setDialog('agenda')
    } else {
      const created = { ...draft, id: crypto.randomUUID() }
      setOutings(items => [...items, created])
      setPreparedOuting(created); setDialog('nutrition')
    }
  }
  const openForm = (outing?: PlannedOuting) => { setEditing(outing ?? null); setDialog('form') }
  const remove = (id: string) => setOutings(items => items.filter(item => item.id !== id))
  return <div className="home">
    <section className="welcome-row"><div><p className="hello">Bonjour Scorpion <span>👋</span></p><p className="muted">Prêt pour de nouvelles aventures ?</p></div><button className="notification" aria-label="Notifications"><BellSimple size={23} /><i>2</i></button></section>
    <section className="race-card glass-card"><div className="race-card__aurora" /><div className="race-card__head"><span>PROCHAINE SORTIE</span><button className="calendar-trigger" aria-label="Ouvrir l’agenda" onClick={() => setDialog('agenda')}><CalendarBlank size={21} /></button></div>{next ? <><h1>{next.title}</h1><div className="race-date"><span>{formatDate(next)} · {next.time}</span><strong>J-{Math.max(1, Math.ceil((outingDate(next).getTime() - Date.now()) / 86400000))}</strong></div><p className="race-goal">Objectif · {next.goal || 'Profiter de la séance'}</p><div className="race-stats"><div><span>{sportLabels[next.sport]} · {next.location}</span><strong>{next.distance} km · {next.elevation} m D+</strong></div><CaretRight /><div><span>{next.sport === 'cycling' ? 'Vitesse cible' : 'Allure cible'}</span><strong>{next.pace}{next.sport === 'cycling' ? ' km/h' : '/km'} · {formatDuration(next.duration)}</strong></div><CaretRight /></div></> : <div className="empty-next"><h1>Aucune sortie planifiée</h1><p>Crée ta prochaine séance pour la voir apparaître ici.</p><button onClick={() => openForm()}><Plus size={15} /> Créer une sortie</button></div>}</section>
    <div className="section-title"><h2>Aujourd’hui</h2><span>Vue d’ensemble</span></div><section className="metrics"><Metric icon={Drop} color="blue" label="Hydratation" value="1.2 L" sub="/ 2.0 L" progress="60%" /><Metric icon={Lightning} color="yellow" label="Énergie" value="158 g" sub="/ 320 g" progress="49%" /><Metric icon={Sparkle} color="green" label="Forme" value="78%" sub="Bonne forme" progress="78%" /></section>
    <section className="activity-card glass-card"><div><span>DERNIÈRE ACTIVITÉ</span><small>Hier</small></div><h3>Sortie longue</h3><div className="activity-card__body"><p><strong>18,7 km</strong><span>1h37’42’’</span><span>154 bpm</span></p><svg viewBox="0 0 110 55" role="img" aria-label="Tracé de la dernière sortie"><polyline points="2,49 15,47 24,35 34,40 45,27 55,21 64,14 76,18 88,4 106,1" /></svg></div></section>
    <section className="tip-card"><span><Sparkle size={20} weight="duotone" /></span><div><small>CONSEIL DU JOUR</small><p>Garde tes deux dernières sorties longues régulières et faciles. La fraîcheur fera la différence.</p></div></section>
    <Button className="cta" size="lg" onClick={() => openForm()}><Lightning size={19} weight="fill" /> Préparer ma prochaine sortie</Button>
    <AnimatePresence>{dialog && <PlannerDialog mode={dialog} outings={futureOutings} editing={editing} preparedOuting={preparedOuting} onClose={() => { setDialog(null); setEditing(null) }} onAdd={() => openForm()} onEdit={openForm} onDelete={remove} onSave={save} onNutrition={() => navigate('/nutrition')} />}</AnimatePresence>
  </div>
}

function PlannerDialog({ mode, outings, editing, preparedOuting, onClose, onAdd, onEdit, onDelete, onSave, onNutrition }: { mode: 'form' | 'agenda' | 'nutrition'; outings: PlannedOuting[]; editing: PlannedOuting | null; preparedOuting: PlannedOuting | null; onClose: () => void; onAdd: () => void; onEdit: (outing: PlannedOuting) => void; onDelete: (id: string) => void; onSave: (draft: OutingDraft) => void; onNutrition: () => void }) {
  const heading = mode === 'agenda' ? ['TON AGENDA', 'Prochaines sorties'] : mode === 'nutrition' ? ['SORTIE ENREGISTRÉE', 'Première préparation'] : [editing ? 'MODIFIER LA SORTIE' : 'NOUVELLE SORTIE', 'Prépare ta séance']
  return <motion.div className="dialog-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><motion.section className="planner-dialog" role="dialog" aria-modal="true" aria-labelledby="planner-title" initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}><header><div><span>{heading[0]}</span><h2 id="planner-title">{heading[1]}</h2></div><button aria-label="Fermer" onClick={onClose}><X size={20} /></button></header>{mode === 'agenda' ? <Agenda outings={outings} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} /> : mode === 'nutrition' && preparedOuting ? <NutritionEstimate outing={preparedOuting} onAgenda={() => onClose()} onNutrition={onNutrition} /> : <OutingForm initial={editing} onSave={onSave} />}</motion.section></motion.div>
}

function OutingForm({ initial, onSave }: { initial: PlannedOuting | null; onSave: (draft: OutingDraft) => void }) {
  const [draft, setDraft] = useState<OutingDraft>(initial ? { date: initial.date, time: initial.time, sport: initial.sport, distance: initial.distance, duration: initial.duration, elevation: initial.elevation, pace: initial.pace, location: initial.location, title: initial.title, goal: initial.goal, notes: initial.notes } : emptyDraft())
  const [distanceChoice, setDistanceChoice] = useState(() => [10, 21.1, 42.195].includes(draft.distance) ? String(draft.distance) : 'other')
  const update = <K extends keyof OutingDraft>(key: K, value: OutingDraft[K]) => setDraft(current => ({ ...current, [key]: value }))
  const chooseDistance = (value: string) => { setDistanceChoice(value); if (value !== 'other') update('distance', Number(value)) }
  const automaticPace = calculateTargetPace(draft.sport, draft.distance, draft.duration)
  const effortIndicator = calculateEffortIndicator(draft.sport, draft.distance, draft.duration, draft.elevation)
  useEffect(() => { if (draft.pace !== automaticPace) setDraft(current => ({ ...current, pace: automaticPace })) }, [automaticPace, draft.pace])
  const submit = (event: FormEvent) => { event.preventDefault(); onSave(draft) }
  return <form className="outing-form" onSubmit={submit}><div className="form-grid"><label>Type d’activité<select value={draft.sport} onChange={e => update('sport', e.target.value as Sport)}>{Object.entries(sportLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Nom de la sortie<input required placeholder="Sortie longue, Trail du lac…" value={draft.title} onChange={e => update('title', e.target.value)} /></label><label>Date<input required min={new Date().toISOString().slice(0, 10)} type="date" value={draft.date} onChange={e => update('date', e.target.value)} /></label><label>Heure<input required type="time" value={draft.time} onChange={e => update('time', e.target.value)} /></label><label>Distance prévue<select value={distanceChoice} onChange={e => chooseDistance(e.target.value)}><option value="10">10 km</option><option value="21.1">Semi-marathon (21,1 km)</option><option value="42.195">Marathon (42,195 km)</option><option value="other">Autres</option></select></label>{distanceChoice === 'other' && <label>Distance personnalisée (km)<input required min="0.1" step="0.1" type="number" value={draft.distance} onChange={e => update('distance', Number(e.target.value))} /></label>}<label>Durée estimée<input required type="time" value={draft.duration} onChange={e => update('duration', e.target.value)} /></label><label>Dénivelé positif (m)<input required min="0" step="10" type="number" value={draft.elevation} onChange={e => update('elevation', Number(e.target.value))} /></label><label className="automatic-pace-field">{draft.sport === 'cycling' ? 'Vitesse cible calculée' : 'Allure cible calculée / km'}<input required readOnly aria-live="polite" value={draft.pace} /><small><Lightning size={13} /> Calcul automatique · {effortIndicator}</small></label><label>Lieu<input required placeholder="Paris, Annecy…" value={draft.location} onChange={e => update('location', e.target.value)} /></label><label className="field-wide">Objectif de la séance<input required placeholder="Endurance, préparation course…" value={draft.goal} onChange={e => update('goal', e.target.value)} /></label><label className="field-wide">Notes facultatives<textarea rows={3} placeholder="Matériel, parcours, consignes…" value={draft.notes} onChange={e => update('notes', e.target.value)} /></label></div><Button className="form-submit" size="lg" type="submit"><CalendarBlank size={18} /> {initial ? 'Enregistrer les modifications' : 'Ajouter à mon agenda'}</Button></form>
}

function Agenda({ outings, onAdd, onEdit, onDelete }: { outings: PlannedOuting[]; onAdd: () => void; onEdit: (outing: PlannedOuting) => void; onDelete: (id: string) => void }) {
  const [view, setView] = useState<'day' | 'week'>('day')
  const [deleting, setDeleting] = useState<PlannedOuting | null>(null)
  let previousWeek = ''
  const confirmDelete = () => { if (deleting) { onDelete(deleting.id); setDeleting(null) } }
  return <div className="agenda"><div className="agenda-toolbar"><div className="agenda-view" role="group" aria-label="Vue de l’agenda"><button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Par jour</button><button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Par semaine</button></div><Button className="agenda-add" onClick={onAdd}><Plus size={17} /> Ajouter</Button></div>{deleting && <div className="delete-confirm" role="alertdialog" aria-label="Confirmer la suppression"><p>Supprimer <strong>{deleting.title}</strong> de ton agenda ?</p><div><button onClick={() => setDeleting(null)}>Annuler</button><button className="danger" onClick={confirmDelete}>Supprimer</button></div></div>}{outings.length ? <div className="agenda-list">{outings.map((outing, index) => { const week = formatWeek(outing); const showWeek = view === 'week' && week !== previousWeek; previousWeek = week; return <div className="agenda-entry" key={outing.id}>{showWeek && <p className="week-label">Semaine du {week}</p>}<article className={`agenda-item ${index === 0 ? 'agenda-item--next' : ''}`}><div className="agenda-date"><strong>{new Date(`${outing.date}T12:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(`${outing.date}T12:00`))}</span></div><div className="agenda-copy"><span>{index === 0 ? 'PROCHAINE · ' : ''}{sportLabels[outing.sport]} · {outing.time}</span><h3>{outing.title}</h3><p><MapPin size={13} /> {outing.location} · {outing.distance} km · {formatDuration(outing.duration)}</p><small>{outing.goal || 'Séance libre'}</small></div><div className="agenda-actions"><button aria-label={`Modifier ${outing.title}`} onClick={() => onEdit(outing)}><PencilSimple size={17} /></button><button className="danger" aria-label={`Supprimer ${outing.title}`} onClick={() => setDeleting(outing)}><Trash size={17} /></button></div></article></div> })}</div> : <div className="agenda-empty"><CalendarBlank size={38} weight="duotone" /><h3>Aucune sortie à venir</h3><p>Planifie ta prochaine séance pour commencer.</p><Button onClick={onAdd}><Plus size={16} /> Créer une sortie</Button></div>}</div>
}

function NutritionEstimate({ outing, onAgenda, onNutrition }: { outing: PlannedOuting; onAgenda: () => void; onNutrition: () => void }) {
  const [hours, minutes] = outing.duration.split(':').map(Number)
  const totalHours = Math.max(.5, hours + minutes / 60)
  const water = Math.round(totalHours * 600 / 50) * 50
  const carbs = Math.round(totalHours * 60)
  return <div className="nutrition-estimate"><div className="estimate-success"><Sparkle size={24} weight="duotone" /><div><strong>{outing.title} est dans ton agenda</strong><span>{formatDate(outing)} · {outing.time}</span></div></div><div className="estimate-grid"><article><span>Durée probable</span><strong>{formatDuration(outing.duration)}</strong></article><article><span>Eau indicative</span><strong>{water} ml</strong></article><article><span>Glucides estimés</span><strong>{carbs} g</strong></article><article><span>Équipement</span><strong>À préparer la veille</strong></article></div><p className="estimate-note">Cette première estimation est indicative et pourra être affinée dans ta stratégie nutritionnelle.</p><div className="estimate-actions"><Button variant="ghost" onClick={onAgenda}>Retour à l’accueil</Button><Button onClick={onNutrition}><Drop size={17} /> Préparer ma nutrition</Button></div></div>
}

function ProductsPage() {
  const { products, setProducts } = useProducts()
  const { orderItems, setOrderItems } = useOrderList()
  const [view, setView] = useState<'stock' | 'packing' | 'order'>('stock')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | ProductCategory>('all')
  const [preference, setPreference] = useState<'all' | 'favorite' | 'poor'>('all')
  const [editing, setEditing] = useState<FuelProduct | 'new' | null>(null)
  const [selected, setSelected] = useState<FuelProduct | null>(null)
  const [deleting, setDeleting] = useState<FuelProduct | null>(null)
  const filtered = useMemo(() => products.filter(product => (category === 'all' || product.category === category) && (preference === 'all' || preference === 'favorite' && product.favorite || preference === 'poor' && product.poorTolerance) && `${product.name} ${product.brand}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))), [products, category, preference, search])
  const saveProduct = (product: FuelProduct) => { setProducts(items => items.some(item => item.id === product.id) ? items.map(item => item.id === product.id ? product : item) : [...items, product]); setEditing(null) }
  const removeProduct = () => { if (deleting) setProducts(items => items.filter(item => item.id !== deleting.id)); setDeleting(null) }
  const addToOrder = (productId: string) => setOrderItems(items => items.some(item => item.productId === productId) ? items.map(item => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { productId, quantity: 1 }])
  return <section className="products-page">
    <div className="products-title"><div><p>STOCK PERSONNEL</p><h1>Mes produits</h1><span>{products.reduce((sum, product) => sum + product.quantity, 0)} portions disponibles · {products.filter(product => product.favorite).length} favoris</span></div>{view === 'stock' && <Button onClick={() => setEditing('new')}><Plus size={17} /> Ajouter</Button>}</div>
    <div className="products-view-tabs" role="group" aria-label="Vue Produits"><button className={view === 'stock' ? 'active' : ''} onClick={() => setView('stock')}><Package size={16} /> Mon stock</button><button className={view === 'packing' ? 'active' : ''} onClick={() => setView('packing')}><Sparkle size={16} /> À emporter</button><button className={view === 'order' ? 'active' : ''} onClick={() => setView('order')}><Basket size={16} /> À commander{orderItems.length > 0 && <i>{orderItems.length}</i>}</button></div>
    {view === 'packing' ? <ProductPlanner products={products} /> : view === 'order' ? <OrderStore products={products} items={orderItems} onChange={setOrderItems} onBack={() => setView('stock')} /> : <><StockPlannerPreview onOpen={() => setView('packing')} /><div className="stock-section-head"><div><span>MON STOCK</span><h2>Mes capsules nutrition</h2></div><strong>{filtered.length} / {products.length}</strong></div>
    <div className="category-tabs" role="group" aria-label="Filtrer par catégorie"><button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>Tous</button>{Object.entries(categoryLabels).map(([value, label]) => <button key={value} className={category === value ? 'active' : ''} onClick={() => setCategory(value as ProductCategory)}>{label}</button>)}</div>
    <div className="product-search glass-card"><label className="search-field"><span>Rechercher</span><div><MagnifyingGlass size={16} /><input aria-label="Rechercher un produit" placeholder="Nom ou marque…" value={search} onChange={event => setSearch(event.target.value)} /></div></label><label><span>Afficher</span><select aria-label="Filtrer par préférence" value={preference} onChange={event => setPreference(event.target.value as 'all' | 'favorite' | 'poor')}><option value="all">Tout mon stock</option><option value="favorite">Mes favoris</option><option value="poor">Mal tolérés</option></select></label></div>
    {deleting && <div className="product-delete" role="alertdialog" aria-label="Confirmer la suppression du produit"><p>Supprimer <strong>{deleting.name}</strong> de ton stock ?</p><div><button onClick={() => setDeleting(null)}>Annuler</button><button onClick={removeProduct}>Supprimer</button></div></div>}
    <div className="compact-capsule-grid">{filtered.map(product => <ProductCard key={product.id} product={product} onOpen={() => setSelected(product)} />)}</div>
    {!filtered.length && <div className="product-empty"><Package size={38} weight="duotone" /><h2>Aucun produit trouvé</h2><p>Modifie les filtres ou ajoute un nouveau produit.</p></div>}</>}
    <AnimatePresence>{selected && <ProductDetails product={selected} ordered={orderItems.some(item => item.productId === selected.id)} onClose={() => setSelected(null)} onOrder={() => addToOrder(selected.id)} onEdit={() => { setEditing(selected); setSelected(null) }} onDelete={() => { setDeleting(selected); setSelected(null) }} />}{editing && <ProductDialog product={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={saveProduct} />}</AnimatePresence>
  </section>
}

function StockPlannerPreview({ onOpen }: { onOpen: () => void }) {
  const { outings } = usePlannedOutings()
  const { plans } = useNutritionPlans()
  const plan = plans[0]
  const outing = outings.find(item => item.id === plan?.outingId)
  return <section className="stock-planner-preview glass-card"><div><span>PRÉPARER UNE SORTIE</span><h2>Composer ma liste à emporter</h2><p>{outing ? `${outing.title} · objectifs nutritionnels enregistrés` : 'Sélectionne une sortie et compose ta stratégie depuis ton stock.'}</p></div><Button onClick={onOpen}><Sparkle size={17} weight="duotone" /> Composer</Button></section>
}

function OrderStore({ products, items, onChange, onBack }: { products: FuelProduct[]; items: OrderItem[]; onChange: (items: OrderItem[]) => void; onBack: () => void }) {
  const rows = items.map(item => ({ item, product: products.find(product => product.id === item.productId) })).filter(row => row.product) as { item: OrderItem; product: FuelProduct }[]
  const update = (productId: string, quantity: number) => onChange(quantity <= 0 ? items.filter(item => item.productId !== productId) : items.map(item => item.productId === productId ? { ...item, quantity } : item))
  if (!rows.length) return <section className="order-empty glass-card"><Basket size={42} weight="duotone" /><span>LISTE D’ACHATS</span><h2>Rien à commander</h2><p>Depuis ton stock, ajoute les produits que tu souhaites renouveler. Cette liste reste enregistrée sur ton appareil.</p><Button onClick={onBack}><Package size={17} /> Parcourir mon stock</Button></section>
  return <section className="order-store"><div className="order-store-head"><div><span>LISTE D’ACHATS</span><h2>À commander</h2><p>{rows.reduce((total, row) => total + row.item.quantity, 0)} portions prévues · sans achat en ligne</p></div><Basket size={28} weight="duotone" /></div><div className="order-list">{rows.map(({ item, product }) => <article key={product.id} className={`order-capsule order-capsule--${product.category}`}><div className="order-capsule-icon"><Package size={22} weight="duotone" /></div><div><span>{categoryLabels[product.category]}</span><h3>{product.name}</h3><p>{product.brand} · {product.portion}</p></div><label><span>Quantité</span><input aria-label={`Quantité à commander de ${product.name}`} type="number" min="1" value={item.quantity} onChange={event => update(product.id, Number(event.target.value))} /></label><button aria-label={`Retirer ${product.name} de la liste à commander`} onClick={() => update(product.id, 0)}><Trash size={17} /></button></article>)}</div><p className="order-note"><Check size={16} /> Liste enregistrée automatiquement sur cet appareil</p></section>
}

function ProductPlanner({ products }: { products: FuelProduct[] }) {
  const { outings } = usePlannedOutings()
  const { plans, setPlans } = useNutritionPlans()
  const [planId, setPlanId] = useState(plans[0]?.id ?? '')
  const [saved, setSaved] = useState(false)
  const selectedPlan = plans.find(plan => plan.id === planId)
  const outing = outings.find(item => item.id === selectedPlan?.outingId)
  const [selection, setSelection] = useState<ProductSelection[]>(selectedPlan?.productSelection ?? [])
  useEffect(() => { setSelection(selectedPlan?.productSelection ?? []); setSaved(false) }, [planId])
  if (!plans.length) return <section className="product-planner glass-card"><div><span>PLAN NUTRITIONNEL</span><h2>Prépare d’abord un plan</h2><p>Enregistre une estimation dans Nutrition pour composer ensuite ta liste de produits.</p></div><NavLink to="/nutrition">Ouvrir Nutrition <CaretRight size={15} /></NavLink></section>
  const hours = outing ? Math.max(.25, outing.duration.split(':').map(Number).reduce((total, value, index) => total + value / (index ? 60 : 1), 0)) : 1
  const targets = { water: Math.round((selectedPlan?.waterPerHour ?? 0) * hours), carbs: Math.round((selectedPlan?.carbsPerHour ?? 0) * hours), sodium: Math.round((selectedPlan?.sodiumPerHour ?? 0) * hours) }
  const totals = selection.reduce((sum, item) => { const product = products.find(candidate => candidate.id === item.productId); return product ? { water: sum.water + product.volume * item.portions, carbs: sum.carbs + product.carbs * item.portions, sodium: sum.sodium + product.sodium * item.portions } : sum }, { water: 0, carbs: 0, sodium: 0 })
  const propose = () => {
    const available = products.filter(product => product.quantity > 0 && !product.poorTolerance).sort((a, b) => Number(b.favorite) - Number(a.favorite))
    const result = new Map<string, number>()
    const add = (product: FuelProduct, portions: number) => { if (portions > 0) result.set(product.id, Math.min(product.quantity, (result.get(product.id) ?? 0) + portions)) }
    const calculate = () => [...result].reduce((sum, [id, portions]) => { const product = products.find(item => item.id === id); return product ? { water: sum.water + product.volume * portions, carbs: sum.carbs + product.carbs * portions, sodium: sum.sodium + product.sodium * portions } : sum }, { water: 0, carbs: 0, sodium: 0 })
    const hydration = available.filter(product => product.volume > 0).sort((a, b) => (b.sodium + b.carbs * 5) - (a.sodium + a.carbs * 5))[0]
    if (hydration) add(hydration, Math.ceil(targets.water / hydration.volume))
    let current = calculate()
    for (const product of available.filter(item => item.carbs > 0).sort((a, b) => b.carbs - a.carbs)) { if (current.carbs >= targets.carbs * .9) break; add(product, Math.ceil((targets.carbs - current.carbs) / product.carbs)); current = calculate() }
    for (const product of available.filter(item => item.sodium > 0).sort((a, b) => b.sodium - a.sodium)) { if (current.sodium >= targets.sodium * .9) break; add(product, Math.ceil((targets.sodium - current.sodium) / product.sodium)); current = calculate() }
    setSelection([...result].map(([productId, portions]) => ({ productId, portions })))
  }
  const save = () => { if (selectedPlan) { setPlans(items => items.map(plan => plan.id === selectedPlan.id ? { ...plan, productSelection: selection, updatedAt: new Date().toISOString() } : plan)); setSaved(true) } }
  const coverage = (value: number, target: number) => target ? Math.min(100, Math.round(value / target * 100)) : 0
  return <section className="product-planner glass-card"><div className="product-planner-head"><div><span>PRÉPARER UNE SORTIE</span><h2>Ma liste à emporter</h2></div><select aria-label="Choisir un plan nutritionnel" value={planId} onChange={event => setPlanId(event.target.value)}>{plans.map(plan => { const planOuting = outings.find(item => item.id === plan.outingId); return <option key={plan.id} value={plan.id}>{planOuting?.title ?? 'Sortie supprimée'}</option> })}</select></div>{outing && <p className="planner-outing"><CalendarBlank size={15} /> {formatDate(outing)} · {formatDuration(outing.duration)}</p>}<div className="planner-targets"><span>OBJECTIFS CALCULÉS</span><strong><Drop size={15} />{targets.water} ml</strong><strong><Lightning size={15} />{targets.carbs} g</strong><strong><Sparkle size={15} />{targets.sodium} mg</strong></div><Button className="planner-propose" onClick={() => { propose(); setSaved(false) }}><Sparkle size={17} weight="duotone" /> Proposer depuis mon stock</Button>{selection.length > 0 && <><div className="planner-selection">{selection.map(item => { const product = products.find(candidate => candidate.id === item.productId); if (!product) return null; return <article key={item.productId}><div><strong>{product.name}</strong><span>{product.brand} · {product.portion} · {product.quantity} en stock</span></div><label><span>Portions</span><input aria-label={`Portions de ${product.name}`} type="number" min="0" max={product.quantity} value={item.portions} onChange={event => { setSaved(false); const portions = Number(event.target.value); setSelection(items => portions <= 0 ? items.filter(selectionItem => selectionItem.productId !== item.productId) : items.map(selectionItem => selectionItem.productId === item.productId ? { ...selectionItem, portions } : selectionItem)) }} /></label></article> })}</div><div className="coverage-grid">{([['Eau', totals.water, targets.water, 'ml'], ['Glucides', totals.carbs, targets.carbs, 'g'], ['Sodium', totals.sodium, targets.sodium, 'mg']] as const).map(([label, value, target, unit]) => <article key={label} className={coverage(value, target) < 80 ? 'low' : ''}><div><span>{label}</span><strong>{coverage(value, target)}%</strong></div><i><b style={{ width: `${coverage(value, target)}%` }} /></i><small>{value} / {target} {unit}</small></article>)}</div><p className="packing-list"><strong>À emporter</strong><span>{selection.map(item => { const product = products.find(candidate => candidate.id === item.productId); return product ? `${item.portions} × ${product.name}` : '' }).filter(Boolean).join(' · ')}</span></p><Button className={`planner-save ${saved ? 'saved' : ''}`} onClick={save}><CalendarBlank size={17} /> {saved ? 'Liste enregistrée avec la sortie' : 'Enregistrer avec la sortie'}</Button></>}</section>
}

function ProductCard({ product, onOpen }: { product: FuelProduct; onOpen: () => void }) {
  const daysLeft = Math.ceil((new Date(`${product.expiry}T12:00`).getTime() - Date.now()) / 86400000)
  return <article className={`compact-product-capsule compact-product-capsule--${product.category} ${product.poorTolerance ? 'compact-product-capsule--poor' : ''}`}><button className="compact-capsule-open" aria-label={`Voir les détails de ${product.name}`} onClick={onOpen}><span className={`compact-capsule-icon product-category-icon--${product.category}`}><Package size={24} weight="duotone" /></span><span className="compact-capsule-main"><span className="compact-capsule-heading"><i>{categoryLabels[product.category]}</i><span>{product.favorite && <Star size={12} weight="fill" />}{product.poorTolerance && <WarningCircle size={13} weight="fill" />}</span></span><strong>{product.name}</strong><small>{product.brand} · {product.portion}</small><span className="compact-capsule-macros"><i><b>{product.carbs} g</b> glucides</i><i><b>{product.sodium} mg</b> sodium</i><i><b>{product.caffeine} mg</b> caféine</i></span></span><span className="compact-capsule-stock"><strong>{product.quantity}</strong><small>en stock</small><i className={daysLeft < 60 ? 'expiring' : ''}>{daysLeft < 0 ? 'Périmé' : `Exp. ${new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' }).format(new Date(`${product.expiry}T12:00`))}`}</i><CaretRight size={16} /></span></button></article>
}

function ProductDetails({ product, ordered, onClose, onOrder, onEdit, onDelete }: { product: FuelProduct; ordered: boolean; onClose: () => void; onOrder: () => void; onEdit: () => void; onDelete: () => void }) {
  const daysLeft = Math.ceil((new Date(`${product.expiry}T12:00`).getTime() - Date.now()) / 86400000)
  return <motion.div className="dialog-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><motion.section className={`product-detail-sheet product-detail-sheet--${product.category}`} role="dialog" aria-modal="true" aria-labelledby="product-detail-title" initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }}><header><div><span>{categoryLabels[product.category]}</span><h2 id="product-detail-title">{product.name}</h2><p>{product.brand} · {product.portion}</p></div><button aria-label="Fermer" onClick={onClose}><X size={20} /></button></header><div className="product-detail-hero"><Package size={48} weight="duotone" /><div><strong>{product.quantity}</strong><span>portions en stock</span></div></div><div className="product-detail-macros"><article><strong>{product.carbs} g</strong><span>Glucides</span></article><article><strong>{product.sodium} mg</strong><span>Sodium</span></article><article><strong>{product.caffeine} mg</strong><span>Caféine</span></article><article><strong>{product.volume} ml</strong><span>Volume</span></article></div><div className="product-detail-info"><p><span>Péremption</span><strong className={daysLeft < 60 ? 'expiring' : ''}>{new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${product.expiry}T12:00`))}</strong></p><p><span>Préférence</span><strong>{product.favorite ? 'Favori' : 'Standard'}</strong></p><p><span>Tolérance</span><strong>{product.poorTolerance ? 'Mal toléré' : 'Bien toléré'}</strong></p><p><span>Allergènes</span><strong>{product.allergens || 'Aucun renseigné'}</strong></p></div><div className="product-detail-actions"><Button variant="ghost" onClick={onEdit}><PencilSimple size={16} /> Modifier</Button><Button className={ordered ? 'ordered' : ''} onClick={onOrder}>{ordered ? <Check size={16} /> : <Basket size={16} />} {ordered ? 'Ajouter encore' : 'À commander'}</Button><button className="detail-delete" aria-label={`Supprimer ${product.name}`} onClick={onDelete}><Trash size={17} /></button></div></motion.section></motion.div>
}

function ProductDialog({ product, onClose, onSave }: { product: FuelProduct | null; onClose: () => void; onSave: (product: FuelProduct) => void }) {
  const [draft, setDraft] = useState<FuelProduct>(product ?? { id: crypto.randomUUID(), name: '', brand: '', category: 'gel', carbs: 25, sodium: 100, caffeine: 0, volume: 0, portion: '1 sachet', allergens: '', quantity: 1, expiry: new Date(Date.now() + 31536000000).toISOString().slice(0, 10), favorite: false, poorTolerance: false })
  const update = <K extends keyof FuelProduct>(key: K, value: FuelProduct[K]) => setDraft(current => ({ ...current, [key]: value }))
  const submit = (event: FormEvent) => { event.preventDefault(); onSave(draft) }
  return <motion.div className="dialog-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><motion.section className="planner-dialog product-dialog" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }}><header><div><span>{product ? 'MODIFIER LE PRODUIT' : 'NOUVEAU PRODUIT'}</span><h2 id="product-dialog-title">{product ? product.name : 'Ajouter à mon stock'}</h2></div><button aria-label="Fermer" onClick={onClose}><X size={20} /></button></header><form className="product-form" onSubmit={submit}><div className="form-grid"><label>Nom<input required value={draft.name} onChange={event => update('name', event.target.value)} /></label><label>Marque<input required value={draft.brand} onChange={event => update('brand', event.target.value)} /></label><label>Catégorie<select value={draft.category} onChange={event => update('category', event.target.value as ProductCategory)}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Portion<input required placeholder="1 sachet de 40 g" value={draft.portion} onChange={event => update('portion', event.target.value)} /></label><label>Glucides (g)<input required type="number" min="0" step="0.1" value={draft.carbs} onChange={event => update('carbs', Number(event.target.value))} /></label><label>Sodium (mg)<input required type="number" min="0" value={draft.sodium} onChange={event => update('sodium', Number(event.target.value))} /></label><label>Caféine (mg)<input required type="number" min="0" value={draft.caffeine} onChange={event => update('caffeine', Number(event.target.value))} /></label><label>Volume (ml)<input required type="number" min="0" value={draft.volume} onChange={event => update('volume', Number(event.target.value))} /></label><label>Quantité possédée<input required type="number" min="0" value={draft.quantity} onChange={event => update('quantity', Number(event.target.value))} /></label><label>Date de péremption<input required type="date" value={draft.expiry} onChange={event => update('expiry', event.target.value)} /></label><label className="field-wide">Allergènes<input placeholder="Gluten, lait, fruits à coque…" value={draft.allergens} onChange={event => update('allergens', event.target.value)} /></label></div><div className="product-toggles"><label><input type="checkbox" checked={draft.favorite} onChange={event => update('favorite', event.target.checked)} /> Produit favori</label><label><input type="checkbox" checked={draft.poorTolerance} onChange={event => update('poorTolerance', event.target.checked)} /> Je le tolère mal</label></div><Button className="form-submit" type="submit">{product ? 'Enregistrer les modifications' : 'Ajouter le produit'}</Button></form></motion.section></motion.div>
}

function NutritionPage() {
  const { outings } = usePlannedOutings()
  const { plans, setPlans } = useNutritionPlans()
  const upcoming = useMemo(() => outings.filter(item => outingDate(item).getTime() > Date.now()).sort((a, b) => outingDate(a).getTime() - outingDate(b).getTime()), [outings])
  const [outingId, setOutingId] = useState(upcoming[0]?.id ?? '')
  const [weather, setWeather] = useState<Weather>('clear')
  const [temperature, setTemperature] = useState(18)
  const [intensity, setIntensity] = useState<EffortIntensity>('moderate')
  const [sweat, setSweat] = useState<SweatRate>('average')
  const [digestion, setDigestion] = useState<DigestiveSensitivity>('normal')
  const [waterPerHour, setWaterPerHour] = useState(500)
  const [carbsPerHour, setCarbsPerHour] = useState(60)
  const [sodiumPerHour, setSodiumPerHour] = useState(500)
  const [hasEstimate, setHasEstimate] = useState(false)
  const [saved, setSaved] = useState(false)
  const [productSelection, setProductSelection] = useState<ProductSelection[]>([])
  const selected = upcoming.find(item => item.id === outingId)
  const savedPlan = plans.find(plan => plan.outingId === outingId)

  useEffect(() => {
    if (!savedPlan) { setWeather('clear'); setTemperature(18); setIntensity('moderate'); setSweat('average'); setDigestion('normal'); setProductSelection([]); setHasEstimate(false); setSaved(false); return }
    setWeather(savedPlan.weather); setTemperature(savedPlan.temperature); setIntensity(savedPlan.intensity); setSweat(savedPlan.sweat); setDigestion(savedPlan.digestion); setWaterPerHour(savedPlan.waterPerHour); setCarbsPerHour(savedPlan.carbsPerHour); setSodiumPerHour(savedPlan.sodiumPerHour); setProductSelection(savedPlan.productSelection ?? []); setHasEstimate(true); setSaved(true)
  }, [outingId, savedPlan?.updatedAt])

  const hours = selected ? Math.max(.25, selected.duration.split(':').map(Number).reduce((total, value, index) => total + value / (index ? 60 : 1), 0)) : 0
  const estimate = () => {
    let water = 500 + (temperature >= 25 ? 150 : temperature <= 8 ? -100 : 0) + (weather === 'humid' ? 150 : weather === 'rain' ? -50 : 0) + (sweat === 'high' ? 150 : sweat === 'low' ? -100 : 0)
    let carbs = intensity === 'hard' ? 80 : intensity === 'easy' ? 40 : 60
    carbs += digestion === 'robust' ? 10 : digestion === 'sensitive' ? -10 : 0
    let sodium = sweat === 'high' ? 750 : sweat === 'low' ? 350 : 500
    if (temperature >= 25 || weather === 'humid') sodium += 150
    water = Math.min(1100, Math.max(250, Math.round(water / 50) * 50)); carbs = Math.min(110, Math.max(20, carbs)); sodium = Math.min(1300, Math.max(250, Math.round(sodium / 50) * 50))
    setWaterPerHour(water); setCarbsPerHour(carbs); setSodiumPerHour(sodium); setHasEstimate(true); setSaved(false)
  }
  const savePlan = () => {
    if (!selected) return
    const plan: NutritionPlan = { id: savedPlan?.id ?? crypto.randomUUID(), outingId: selected.id, weather, temperature, intensity, sweat, digestion, waterPerHour, carbsPerHour, sodiumPerHour, productSelection, updatedAt: new Date().toISOString() }
    setPlans(items => [...items.filter(item => item.outingId !== selected.id), plan]); setSaved(true)
  }
  const warnings = useMemo(() => {
    const items: string[] = []
    if (waterPerHour < 300) items.push('Hydratation très faible : vérifie la température et ton niveau de transpiration.')
    if (waterPerHour > 1000) items.push('Hydratation très élevée : évite de boire au-delà de ta tolérance.')
    if (carbsPerHour < 30 && hours > 1.5) items.push('Apport en glucides faible pour une sortie longue.')
    if (carbsPerHour > 90) items.push('Apport en glucides élevé : teste cette quantité progressivement à l’entraînement.')
    if (sodiumPerHour < 300 && (temperature > 24 || sweat === 'high')) items.push('Sodium potentiellement insuffisant dans ces conditions.')
    if (sodiumPerHour > 1200) items.push('Sodium très élevé : vérifie la valeur avant d’enregistrer.')
    if (selected && hours < .5 && selected.distance > 20) items.push('Distance et durée semblent incohérentes pour cette sortie.')
    return items
  }, [waterPerHour, carbsPerHour, sodiumPerHour, hours, temperature, sweat, selected])
  const timeline = useMemo(() => Array.from({ length: Math.ceil(hours * 2) }, (_, index) => { const start = index * .5; const portion = Math.min(.5, Math.max(0, hours - start)); return { minute: Math.min(Math.round((index + 1) * 30), Math.round(hours * 60)), water: Math.round(waterPerHour * portion / 10) * 10, carbs: Math.round(carbsPerHour * portion), sodium: Math.round(sodiumPerHour * portion / 10) * 10 } }), [hours, waterPerHour, carbsPerHour, sodiumPerHour])
  if (!upcoming.length) return <section className="nutrition-page nutrition-empty-page"><div className="nutrition-title"><p>PLAN DE RAVITAILLEMENT</p><h1>Nutrition</h1><span>Crée d’abord une sortie dans ton agenda pour préparer son ravitaillement.</span></div><NavLink className="nutrition-home-link" to="/accueil"><Plus size={17} /> Planifier une sortie</NavLink></section>
  return <section className="nutrition-page"><div className="nutrition-title"><p>PLAN DE RAVITAILLEMENT</p><h1>Prépare ton effort</h1><span>Des estimations personnalisées à tester pendant tes entraînements.</span></div><div className="nutrition-layout"><div className="nutrition-config glass-card"><h2>1. Ta sortie et tes conditions</h2><div className="nutrition-form"><label className="field-wide">Sortie enregistrée<select value={outingId} onChange={event => setOutingId(event.target.value)}>{upcoming.map(outing => <option key={outing.id} value={outing.id}>{outing.title} · {formatDate(outing)}</option>)}</select></label><label>Météo<select value={weather} onChange={event => { setWeather(event.target.value as Weather); setSaved(false) }}>{Object.entries(weatherLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Température (°C)<input type="number" min="-10" max="50" value={temperature} onChange={event => { setTemperature(Number(event.target.value)); setSaved(false) }} /></label><label>Intensité prévue<select value={intensity} onChange={event => { setIntensity(event.target.value as EffortIntensity); setSaved(false) }}>{Object.entries(intensityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Transpiration<select value={sweat} onChange={event => { setSweat(event.target.value as SweatRate); setSaved(false) }}>{Object.entries(sweatLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="field-wide">Sensibilité digestive<select value={digestion} onChange={event => { setDigestion(event.target.value as DigestiveSensitivity); setSaved(false) }}>{Object.entries(digestionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div className="outing-summary"><span>{selected && sportLabels[selected.sport]}</span><strong>{selected?.distance} km · {selected && formatDuration(selected.duration)}</strong><small>{selected?.goal || 'Séance libre'}</small></div><Button className="nutrition-generate" onClick={estimate}><Sparkle size={18} weight="duotone" /> {savedPlan ? 'Recalculer le plan' : 'Générer mon estimation'}</Button></div>{hasEstimate && selected && <div className="nutrition-results"><section className="nutrition-rates glass-card"><div className="nutrition-section-head"><div><span>2. RECOMMANDATIONS</span><h2>Par heure</h2></div>{saved && <small>Plan enregistré</small>}</div><div className="rate-grid"><label><Drop size={18} weight="duotone" /><span>Eau</span><div><input aria-label="Eau par heure" type="number" min="0" step="50" value={waterPerHour} onChange={event => { setWaterPerHour(Number(event.target.value)); setSaved(false) }} /><b>ml/h</b></div></label><label><Lightning size={18} weight="duotone" /><span>Glucides</span><div><input aria-label="Glucides par heure" type="number" min="0" step="5" value={carbsPerHour} onChange={event => { setCarbsPerHour(Number(event.target.value)); setSaved(false) }} /><b>g/h</b></div></label><label><Sparkle size={18} weight="duotone" /><span>Sodium</span><div><input aria-label="Sodium par heure" type="number" min="0" step="50" value={sodiumPerHour} onChange={event => { setSodiumPerHour(Number(event.target.value)); setSaved(false) }} /><b>mg/h</b></div></label></div><p className="manual-hint">Tu peux ajuster manuellement chaque recommandation avant l’enregistrement.</p></section><section className="nutrition-totals glass-card"><span>QUANTITÉS À EMPORTER</span><h2>Pour {formatDuration(selected.duration)}</h2><div><article><small>Eau totale</small><strong>{Math.round(waterPerHour * hours / 50) * 50} ml</strong></article><article><small>Glucides totaux</small><strong>{Math.round(carbsPerHour * hours)} g</strong></article><article><small>Sodium total</small><strong>{Math.round(sodiumPerHour * hours / 50) * 50} mg</strong></article></div></section>{warnings.length > 0 && <section className="nutrition-warnings">{warnings.map(warning => <p key={warning}>⚠ {warning}</p>)}</section>}<section className="nutrition-timeline glass-card"><span>CHRONOLOGIE</span><h2>Pendant la sortie</h2><div>{timeline.map((step, index) => <article key={`${step.minute}-${index}`}><i>{step.minute >= 60 ? `${Math.floor(step.minute / 60)}h${String(step.minute % 60).padStart(2, '0')}` : `${step.minute} min`}</i><p><strong>{step.water} ml</strong> d’eau · <strong>{step.carbs} g</strong> de glucides · <strong>{step.sodium} mg</strong> de sodium</p></article>)}</div></section><p className="nutrition-disclaimer">Ces recommandations sont des estimations générales, pas des prescriptions médicales. Teste-les progressivement et adapte-les à tes sensations. En cas de doute médical, demande conseil à un professionnel de santé.</p><Button className="nutrition-save" onClick={savePlan}><CalendarBlank size={18} /> {saved ? 'Plan enregistré' : 'Enregistrer avec cette sortie'}</Button></div>}</div></section>
}

function Metric({ icon: Icon, color, label, value, sub, progress }: { icon: IconType; color: string; label: string; value: string; sub: string; progress: string }) { return <article className="metric glass-card"><div className={`metric__label ${color}`}><Icon size={15} weight="duotone" /> {label}</div><strong>{value}</strong><span>{sub}</span><i><b style={{ width: progress }} /></i></article> }
function Placeholder({ icon: Icon, kicker, title, copy }: { icon: IconType; kicker: string; title: string; copy: string }) { return <section className="placeholder"><motion.div className="placeholder__icon" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}><Icon size={42} weight="duotone" /></motion.div><p>{kicker}</p><h1>{title}</h1><span>{copy}</span><div className="soon"><Sparkle size={14} /> Bientôt disponible</div></section> }

export default function App() { const [showSplash, setShowSplash] = useState(true); return <><AnimatePresence>{showSplash && <Splash onDone={() => setShowSplash(false)} />}</AnimatePresence><AppLayout /></> }
