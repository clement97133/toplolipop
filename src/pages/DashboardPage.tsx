import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, Users, Package, UserCheck,
  ChevronRight, Clock, MapPin, Sparkles,
} from 'lucide-react'
import { statsApi, eventsApi } from '../lib/api'
import { formatDate } from '../lib/utils'
import type { Event } from '../types'

// ─── Couleurs de type d'événement ────────────────────────────────────────────
const EVENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  birthday:   { bg: 'bg-rose-50',   text: 'text-rose-600',  dot: 'bg-rose-400' },
  wedding:    { bg: 'bg-pink-50',   text: 'text-pink-600',  dot: 'bg-pink-400' },
  corporate:  { bg: 'bg-blue-50',   text: 'text-blue-600',  dot: 'bg-blue-400' },
  babysit:    { bg: 'bg-brand-50',  text: 'text-brand-600', dot: 'bg-brand-400' },
  animation:  { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-400' },
  other:      { bg: 'bg-cream-200', text: 'text-navy-600',  dot: 'bg-navy-300' },
}
const EVENT_LABELS: Record<string, string> = {
  birthday: 'Anniversaire', wedding: 'Mariage', corporate: 'Entreprise',
  babysit: 'Baby-sitting', animation: 'Animation', other: 'Autre',
}

// ─── Salutation selon l'heure ─────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 18) return 'Bonjour'
  return 'Bonsoir'
}

function todayLabel() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: number | undefined
  icon: React.ElementType
  gradient: string
  onClick?: () => void
}
function StatCard({ label, value, icon: Icon, gradient, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl p-5 text-left w-full transition-transform duration-200 active:scale-95 ${gradient}`}
      style={{ boxShadow: '0 4px 20px 0 rgb(0 0 0 / 0.10)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-white leading-none">
            {value ?? <span className="text-2xl opacity-60">—</span>}
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-white" />
        </div>
      </div>
      {/* Orbe décoratif */}
      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
    </button>
  )
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventRow({ event }: { event: Event }) {
  const navigate = useNavigate()
  const colors = EVENT_COLORS[event.type] ?? EVENT_COLORS.other

  return (
    <button
      onClick={() => navigate('/calendar')}
      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-cream-200 active:bg-cream-300 transition-colors duration-150 text-left"
    >
      {/* Dot couleur */}
      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${colors.dot}`} />

      {/* Infos event */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy-700 truncate">{event.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {event.start_time && (
            <span className="flex items-center gap-1 text-xs text-navy-400">
              <Clock size={11} />
              {event.start_time}
              {event.end_time && ` — ${event.end_time}`}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-navy-400 truncate">
              <MapPin size={11} />
              {event.location}
            </span>
          )}
        </div>
      </div>

      {/* Badge type */}
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${colors.bg} ${colors.text}`}>
        {EVENT_LABELS[event.type] ?? event.type}
      </span>

      <ChevronRight size={14} className="text-navy-300 flex-shrink-0" />
    </button>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: statsApi.get })

  // Prochains événements (30 prochains jours)
  const today = new Date().toISOString().split('T')[0]
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => eventsApi.list({ from: today, to: in30 }),
  })

  const nextEvents = [...upcomingEvents]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  return (
    <div className="min-h-screen bg-cream-100">
      {/* ── Header festif ── */}
      <div
        className="relative overflow-hidden px-5 header-top pb-8"
        style={{
          background: 'linear-gradient(145deg, #1A2567 0%, #243580 55%, #2E4299 100%)',
        }}
      >
        {/* Décoration étoiles */}
        <div className="absolute top-6 right-8 opacity-30">
          <Sparkles size={28} className="text-brand-300" />
        </div>
        <div className="absolute top-14 right-16 opacity-15">
          <Sparkles size={16} className="text-brand-200" />
        </div>
        <div className="absolute bottom-4 left-4 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 right-0 w-48 h-48 rounded-full bg-brand-500/10" />

        {/* Contenu */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand-300 text-sm font-medium">{getGreeting()} ✨</span>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">TOPLOLIPOP</h1>
          <p className="text-navy-200 text-sm mt-1 capitalize">{todayLabel()}</p>
        </div>
      </div>

      {/* ── Stats — grille 2×2 ── */}
      <div className="px-4 -mt-5 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Clients"
            value={stats?.clients}
            icon={Users}
            gradient="bg-gradient-to-br from-brand-500 to-brand-600"
            onClick={() => navigate('/clients')}
          />
          <StatCard
            label="Événements"
            value={stats?.events}
            icon={CalendarDays}
            gradient="bg-gradient-to-br from-navy-700 to-navy-600"
            onClick={() => navigate('/calendar')}
          />
          <StatCard
            label="Matériel dispo"
            value={stats?.availableEquipment}
            icon={Package}
            gradient="bg-gradient-to-br from-palm-500 to-palm-600"
            onClick={() => navigate('/general')}
          />
          <StatCard
            label="Collaborateurs"
            value={stats?.activeCollaborators}
            icon={UserCheck}
            gradient="bg-gradient-to-br from-purple-500 to-purple-700"
            onClick={() => navigate('/collaborators')}
          />
        </div>
      </div>

      {/* ── Prochains événements ── */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-navy-700">Prochains événements</h2>
          <button
            onClick={() => navigate('/calendar')}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Voir tout <ChevronRight size={13} />
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          {nextEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-cream-200 flex items-center justify-center mb-3">
                <CalendarDays size={24} className="text-brand-400" />
              </div>
              <p className="text-sm font-semibold text-navy-600">Aucun événement à venir</p>
              <p className="text-xs text-navy-400 mt-1">Les prochaines réservations s'afficheront ici</p>
            </div>
          ) : (
            <div className="divide-y divide-cream-200">
              {nextEvents.map((ev) => (
                <div key={ev.id} className="px-2">
                  {/* Date flottante si 1er de ce jour */}
                  <EventRow event={ev} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Accès rapides ── */}
      <div className="px-4 mt-6 mb-4">
        <h2 className="text-base font-bold text-navy-700 mb-3">Accès rapides</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Nouveau client',     emoji: '👤', path: '/clients',       color: 'from-brand-400 to-brand-500' },
            { label: 'Voir le calendrier', emoji: '📅', path: '/calendar',      color: 'from-navy-500 to-navy-600' },
            { label: 'Équipe',             emoji: '🤝', path: '/collaborators', color: 'from-purple-400 to-purple-600' },
            { label: 'Matériel & tarifs',  emoji: '⚙️', path: '/general',       color: 'from-palm-500 to-palm-600' },
          ].map(({ label, emoji, path, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-left text-white active:scale-95 transition-transform duration-150`}
              style={{ boxShadow: '0 2px 12px 0 rgb(0 0 0 / 0.12)' }}
            >
              <div className="text-2xl mb-2">{emoji}</div>
              <p className="text-xs font-semibold leading-tight">{label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
