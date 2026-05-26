import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameDay, isSameMonth,
  isToday, addMonths, subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Calendar, Tag, X } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { eventsApi, clientsApi } from '../lib/api'
import { formatDate } from '../lib/utils'
import {
  EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, EVENT_STATUS_COLORS,
  EVENT_STATUS_LABELS, EVENT_TYPE_CALENDAR_COLORS,
} from '../lib/constants'
import type { Event as AppEvent, EventType, EventStatus } from '../types'

// ─── Constantes ───────────────────────────────────────────────────────────────
const WEEK_DAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

const FILTER_TYPES = [
  { value: 'all', label: 'Tous' },
  { value: 'animation', label: '🎭 Animation' },
  { value: 'babysitting', label: '🍼 Baby-sitting' },
  { value: 'rental', label: '📦 Location' },
  { value: 'delivery', label: '🚚 Livraison' },
]

// ─── Grille calendrier ────────────────────────────────────────────────────────
function CalendarGrid({
  currentMonth, events, selectedDate, onSelectDate,
}: {
  currentMonth: Date
  events: AppEvent[]
  selectedDate: Date
  onSelectDate: (d: Date) => void
}) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd   = endOfMonth(currentMonth)
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 })
  const days       = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <div>
      {/* En-têtes jours */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold text-navy-400 py-1 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Cellules */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const dayStr    = format(day, 'yyyy-MM-dd')
          const dayEvents = events.filter((e) => e.date === dayStr)
          const isSelected   = isSameDay(day, selectedDate)
          const isCurMonth   = isSameMonth(day, currentMonth)
          const isTodayDate  = isToday(day)

          return (
            <button
              key={dayStr}
              onClick={() => onSelectDate(day)}
              className="flex flex-col items-center py-1 rounded-2xl transition-colors hover:bg-cream-100 active:bg-cream-200"
            >
              {/* Numéro du jour */}
              <span className={[
                'w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all',
                isSelected
                  ? 'bg-brand-500 text-white font-bold shadow-btn'
                  : isTodayDate
                  ? 'bg-navy-100 text-navy-800 font-bold'
                  : isCurMonth
                  ? 'text-navy-700 font-medium'
                  : 'text-navy-300 font-normal',
              ].join(' ')}>
                {format(day, 'd')}
              </span>

              {/* Points d'événements */}
              <div className="flex gap-0.5 mt-0.5 h-2 items-center justify-center">
                {dayEvents.slice(0, 3).map((ev, i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: EVENT_TYPE_CALENDAR_COLORS[ev.type as EventType] ?? '#ccc' }}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[9px] text-navy-400 font-bold leading-none">
                    +{dayEvents.length - 3}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Liste d'événements pour un jour ─────────────────────────────────────────
function DayEventsList({
  events, date, onOpenDetail, onAddEvent,
}: {
  events: AppEvent[]
  date: Date
  onOpenDetail: (ev: AppEvent) => void
  onAddEvent: () => void
}) {
  const dayStr    = format(date, 'yyyy-MM-dd')
  const dayEvents = events
    .filter((e) => e.date === dayStr)
    .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))

  const dateLabel = format(date, "EEEE d MMMM", { locale: fr })

  return (
    <div className="px-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-navy-700 capitalize">{dateLabel}</h3>
        <button
          onClick={onAddEvent}
          className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          <Plus size={13} />Ajouter
        </button>
      </div>

      {dayEvents.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-card p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center mx-auto mb-3">
            <Calendar size={20} className="text-brand-400" />
          </div>
          <p className="text-sm font-medium text-navy-600">Aucun événement ce jour</p>
          <p className="text-xs text-navy-400 mt-1">Appuyez sur + pour en créer un</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayEvents.map((ev) => (
            <button
              key={ev.id}
              onClick={() => onOpenDetail(ev)}
              className="w-full text-left bg-white rounded-3xl shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all p-4 flex items-start gap-3"
            >
              {/* Bande couleur type */}
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{ backgroundColor: EVENT_TYPE_CALENDAR_COLORS[ev.type as EventType] ?? '#ccc' }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-navy-800 truncate">{ev.title}</p>
                {ev.client_name && (
                  <p className="text-xs text-navy-500 mt-0.5">{ev.client_name}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                  {ev.start_time && (
                    <span className="flex items-center gap-1 text-xs text-navy-400">
                      <Clock size={10} />
                      {ev.start_time}{ev.end_time ? ` → ${ev.end_time}` : ''}
                    </span>
                  )}
                  {ev.location && (
                    <span className="flex items-center gap-1 text-xs text-navy-400 truncate max-w-[140px]">
                      <MapPin size={10} />
                      {ev.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <Badge className={EVENT_TYPE_COLORS[ev.type as EventType]}>
                  {EVENT_TYPE_LABELS[ev.type as EventType]}
                </Badge>
                <Badge className={EVENT_STATUS_COLORS[ev.status as EventStatus]}>
                  {EVENT_STATUS_LABELS[ev.status as EventStatus]}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Prochains événements (hors jour sélectionné) ────────────────────────────
function UpcomingEvents({ events, selectedDate, onOpenDetail }: {
  events: AppEvent[]
  selectedDate: Date
  onOpenDetail: (ev: AppEvent) => void
}) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const selStr = format(selectedDate, 'yyyy-MM-dd')

  const upcoming = events
    .filter((e) => e.date >= today && e.date !== selStr)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start_time ?? '').localeCompare(b.start_time ?? ''))
    .slice(0, 5)

  if (upcoming.length === 0) return null

  return (
    <div className="px-4 mt-5 pb-2">
      <h3 className="text-sm font-bold text-navy-700 mb-3">Prochains événements</h3>
      <div className="space-y-2">
        {upcoming.map((ev) => {
          const evDate = new Date(ev.date)
          return (
            <button
              key={ev.id}
              onClick={() => onOpenDetail(ev)}
              className="w-full text-left bg-white rounded-2xl shadow-card active:scale-[0.98] transition-all p-3 flex items-center gap-3"
            >
              {/* Mini date block */}
              <div
                className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white"
                style={{ background: EVENT_TYPE_CALENDAR_COLORS[ev.type as EventType] ?? '#ccc' }}
              >
                <span className="text-[10px] font-medium leading-none opacity-80">
                  {format(evDate, 'MMM', { locale: fr }).toUpperCase()}
                </span>
                <span className="text-base font-bold leading-tight">
                  {format(evDate, 'd')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-navy-800 truncate">{ev.title}</p>
                <p className="text-xs text-navy-400 capitalize">
                  {format(evDate, 'EEEE', { locale: fr })}
                  {ev.start_time ? ` · ${ev.start_time}` : ''}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Modal détail événement ───────────────────────────────────────────────────
function EventDetailModal({
  event, open, onClose, onEdit, onDelete,
}: {
  event: AppEvent | null
  open: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  if (!event) return null
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event.title}
      size="md"
      footer={
        <>
          <Button variant="danger" size="sm" onClick={onDelete}>Supprimer</Button>
          <div className="flex-1" />
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
          <Button onClick={onEdit}>Modifier</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={EVENT_TYPE_COLORS[event.type as EventType]}>
            {EVENT_TYPE_LABELS[event.type as EventType]}
          </Badge>
          <Badge className={EVENT_STATUS_COLORS[event.status as EventStatus]}>
            {EVENT_STATUS_LABELS[event.status as EventStatus]}
          </Badge>
        </div>
        <div className="bg-cream-100 rounded-2xl p-4 space-y-3">
          {event.client_name && (
            <div className="flex items-center gap-2.5 text-sm text-navy-700">
              <Users size={15} className="text-brand-400 flex-shrink-0" />
              <span>{event.client_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-sm text-navy-700">
            <Calendar size={15} className="text-brand-400 flex-shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>
          {event.start_time && (
            <div className="flex items-center gap-2.5 text-sm text-navy-700">
              <Clock size={15} className="text-brand-400 flex-shrink-0" />
              <span>{event.start_time}{event.end_time ? ` → ${event.end_time}` : ''}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2.5 text-sm text-navy-700">
              <MapPin size={15} className="text-brand-400 flex-shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          {event.theme && (
            <div className="flex items-center gap-2.5 text-sm text-navy-700">
              <Tag size={15} className="text-brand-400 flex-shrink-0" />
              <span>Thème : {event.theme}</span>
            </div>
          )}
          {event.child_count > 0 && (
            <div className="flex items-center gap-2.5 text-sm text-navy-700">
              <Users size={15} className="text-brand-400 flex-shrink-0" />
              <span>{event.child_count} enfant{event.child_count > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        {event.instructions && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <p className="text-xs font-bold text-amber-700 mb-1">Instructions</p>
            <p className="text-sm text-amber-800">{event.instructions}</p>
          </div>
        )}
        {event.notes && (
          <div className="bg-cream-100 rounded-2xl p-3">
            <p className="text-xs font-bold text-navy-500 mb-1">Notes</p>
            <p className="text-sm text-navy-600">{event.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Modal formulaire événement ───────────────────────────────────────────────
function EventFormModal({
  open, onClose, initial, defaultDate,
}: {
  open: boolean
  onClose: () => void
  initial?: AppEvent | null
  defaultDate?: string
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<AppEvent>>(
    initial ?? { status: 'pending', type: 'animation', child_count: 0, date: defaultDate ?? '' }
  )
  const set = (k: keyof AppEvent, v: string | number | null) => setForm((f) => ({ ...f, [k]: v }))

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.list() })

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Partial<AppEvent>) =>
      initial ? eventsApi.update(initial.id, d) : eventsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); onClose() },
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Modifier l'événement" : 'Nouvel événement'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={() => mutate(form)} loading={isPending}>Enregistrer</Button>
        </>
      }
    >
      {/* Formulaire entièrement en colonne unique sur mobile */}
      <div className="space-y-4">
        <Input label="Titre" required value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} placeholder="Ex: Anniversaire de Lucas" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Client"
            value={form.client_id ?? ''}
            onChange={(e) => set('client_id', e.target.value || null)}
            options={clients.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))}
            placeholder="Sélectionner un client…"
          />
          <Select
            label="Type"
            required
            value={form.type ?? 'animation'}
            onChange={(e) => set('type', e.target.value as EventType)}
            options={[
              { value: 'animation', label: 'Animation' },
              { value: 'babysitting', label: 'Baby-sitting' },
              { value: 'rental', label: 'Location' },
              { value: 'delivery', label: 'Livraison' },
              { value: 'other', label: 'Autre' },
            ]}
          />
          <Input label="Date" required type="date" value={form.date ?? ''} onChange={(e) => set('date', e.target.value)} />
          <Select
            label="Statut"
            value={form.status ?? 'pending'}
            onChange={(e) => set('status', e.target.value as EventStatus)}
            options={[
              { value: 'pending', label: 'En attente' },
              { value: 'confirmed', label: 'Confirmé' },
              { value: 'in_progress', label: 'En cours' },
              { value: 'completed', label: 'Terminé' },
              { value: 'cancelled', label: 'Annulé' },
            ]}
          />
          <Input label="Heure début" type="time" value={form.start_time ?? ''} onChange={(e) => set('start_time', e.target.value)} />
          <Input label="Heure fin" type="time" value={form.end_time ?? ''} onChange={(e) => set('end_time', e.target.value)} />
        </div>

        <Input label="Lieu" value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Thème" value={form.theme ?? ''} onChange={(e) => set('theme', e.target.value)} placeholder="Licorne, Super-héros…" />
          <Input label="Nombre d'enfants" type="number" min="0" value={form.child_count ?? 0} onChange={(e) => set('child_count', parseInt(e.target.value) || 0)} />
        </div>

        <Textarea label="Instructions" value={form.instructions ?? ''} onChange={(e) => set('instructions', e.target.value)} rows={2} />
        <Textarea label="Notes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
      </div>
    </Modal>
  )
}

// ─── Page principale Calendrier ───────────────────────────────────────────────
export default function CalendarPage() {
  const qc = useQueryClient()
  const [currentMonth, setCurrentMonth]   = useState(new Date())
  const [selectedDate,  setSelectedDate]  = useState(new Date())
  const [typeFilter,    setTypeFilter]    = useState('all')
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null)
  const [showDetail,    setShowDetail]    = useState(false)
  const [showForm,      setShowForm]      = useState(false)
  const [editingEvent,  setEditingEvent]  = useState<AppEvent | null>(null)

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => eventsApi.list() })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setShowDetail(false) },
  })

  const filtered = events.filter((e) => typeFilter === 'all' || e.type === typeFilter)

  const openAdd = () => {
    setEditingEvent(null)
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-cream-100">
      {/* ── Header marine ── */}
      <div
        className="px-5 pt-12 pb-5"
        style={{ background: 'linear-gradient(145deg, #1A2567 0%, #243580 100%)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Calendrier</h1>
          <Button size="sm" onClick={openAdd}>
            <Plus size={14} />Événement
          </Button>
        </div>

        {/* Filtres par type — scroll horizontal sans barre */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {FILTER_TYPES.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={[
                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors',
                typeFilter === f.value
                  ? 'bg-brand-400 text-navy-900'
                  : 'bg-white/10 text-navy-100 hover:bg-white/20',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grille mois ── */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-3xl shadow-card p-4">
          {/* Navigation mois */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-cream-100 active:bg-cream-200 text-navy-600 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            <h2 className="text-base font-bold text-navy-800 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h2>

            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-cream-100 active:bg-cream-200 text-navy-600 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Grille */}
          <CalendarGrid
            currentMonth={currentMonth}
            events={filtered}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d)
              // Si on navigue sur un autre mois en cliquant un jour hors mois courant
              if (!isSameMonth(d, currentMonth)) setCurrentMonth(startOfMonth(d))
            }}
          />

          {/* Légende types */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-3 border-t border-cream-200">
            {Object.entries(EVENT_TYPE_CALENDAR_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-navy-400 font-medium">
                  {EVENT_TYPE_LABELS[type as EventType]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Événements du jour sélectionné ── */}
      <DayEventsList
        events={filtered}
        date={selectedDate}
        onOpenDetail={(ev) => { setSelectedEvent(ev); setShowDetail(true) }}
        onAddEvent={openAdd}
      />

      {/* ── Prochains événements ── */}
      <UpcomingEvents
        events={filtered}
        selectedDate={selectedDate}
        onOpenDetail={(ev) => { setSelectedEvent(ev); setShowDetail(true) }}
      />

      {/* Espace bas */}
      <div className="h-4" />

      {/* ── Modals ── */}
      <EventDetailModal
        event={selectedEvent}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        onEdit={() => {
          setEditingEvent(selectedEvent)
          setShowDetail(false)
          setShowForm(true)
        }}
        onDelete={() => {
          if (selectedEvent && confirm('Supprimer cet événement ?')) {
            deleteMutation.mutate(selectedEvent.id)
          }
        }}
      />
      <EventFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingEvent(null) }}
        initial={editingEvent}
        defaultDate={format(selectedDate, 'yyyy-MM-dd')}
      />
    </div>
  )
}
