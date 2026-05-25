import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core'
import { X, MapPin, Clock, Users, Calendar, Tag } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { eventsApi, clientsApi } from '../lib/api'
import { formatDate } from '../lib/utils'
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, EVENT_STATUS_COLORS, EVENT_STATUS_LABELS, EVENT_TYPE_CALENDAR_COLORS } from '../lib/constants'
import type { Event as AppEvent, EventType, EventStatus } from '../types'

const FILTER_TYPES: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'animation', label: 'Animation' },
  { value: 'babysitting', label: 'Baby-sitting' },
  { value: 'rental', label: 'Location' },
  { value: 'delivery', label: 'Livraison' },
]

function EventDetailModal({ event, open, onClose, onEdit }: { event: AppEvent | null; open: boolean; onClose: () => void; onEdit: () => void }) {
  if (!event) return null
  return (
    <Modal open={open} onClose={onClose} title={event.title} size="md"
      footer={<><Button variant="secondary" onClick={onClose}>Fermer</Button><Button onClick={onEdit}>Modifier</Button></>}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={EVENT_TYPE_COLORS[event.type]}>{EVENT_TYPE_LABELS[event.type]}</Badge>
          <Badge className={EVENT_STATUS_COLORS[event.status]}>{EVENT_STATUS_LABELS[event.status]}</Badge>
        </div>
        <div className="space-y-2.5">
          {event.client_name && (
            <div className="flex items-center gap-2.5 text-sm text-gray-700">
              <Users size={15} className="text-gray-400" />
              <span>{event.client_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-sm text-gray-700">
            <Calendar size={15} className="text-gray-400" />
            <span>{formatDate(event.date)}</span>
          </div>
          {event.start_time && (
            <div className="flex items-center gap-2.5 text-sm text-gray-700">
              <Clock size={15} className="text-gray-400" />
              <span>{event.start_time}{event.end_time ? ` → ${event.end_time}` : ''}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2.5 text-sm text-gray-700">
              <MapPin size={15} className="text-gray-400" />
              <span>{event.location}</span>
            </div>
          )}
          {event.theme && (
            <div className="flex items-center gap-2.5 text-sm text-gray-700">
              <Tag size={15} className="text-gray-400" />
              <span>Thème : {event.theme}</span>
            </div>
          )}
          {event.child_count > 0 && (
            <div className="flex items-center gap-2.5 text-sm text-gray-700">
              <Users size={15} className="text-gray-400" />
              <span>{event.child_count} enfant{event.child_count > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        {event.instructions && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-700 mb-1">Instructions</p>
            <p className="text-sm text-amber-800">{event.instructions}</p>
          </div>
        )}
        {event.notes && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-600">{event.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

function EventFormModal({ open, onClose, initial, defaultDate }: { open: boolean; onClose: () => void; initial?: AppEvent | null; defaultDate?: string }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<AppEvent>>(
    initial ?? { status: 'pending', type: 'animation', child_count: 0, date: defaultDate ?? '' }
  )
  const set = (k: keyof AppEvent, v: string | number | null) => setForm((f) => ({ ...f, [k]: v }))

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.list() })

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Partial<AppEvent>) => initial ? eventsApi.update(initial.id, d) : eventsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); onClose() },
  })

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Modifier l’événement" : 'Nouvel événement'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={() => mutate(form)} loading={isPending}>Enregistrer</Button></>}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Titre" required value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} placeholder="Ex: Anniversaire de Lucas" />
        </div>
        <Select label="Client" value={form.client_id ?? ''} onChange={(e) => set('client_id', e.target.value || null)}
          options={clients.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))}
          placeholder="Sélectionner un client…" />
        <Select label="Type" required value={form.type ?? 'animation'} onChange={(e) => set('type', e.target.value as EventType)}
          options={[{ value: 'animation', label: 'Animation' }, { value: 'babysitting', label: 'Baby-sitting' }, { value: 'rental', label: 'Location' }, { value: 'delivery', label: 'Livraison' }, { value: 'other', label: 'Autre' }]} />
        <Input label="Date" required type="date" value={form.date ?? ''} onChange={(e) => set('date', e.target.value)} />
        <Select label="Statut" value={form.status ?? 'pending'} onChange={(e) => set('status', e.target.value as EventStatus)}
          options={[{ value: 'pending', label: 'En attente' }, { value: 'confirmed', label: 'Confirmé' }, { value: 'in_progress', label: 'En cours' }, { value: 'completed', label: 'Terminé' }, { value: 'cancelled', label: 'Annulé' }]} />
        <Input label="Heure de début" type="time" value={form.start_time ?? ''} onChange={(e) => set('start_time', e.target.value)} />
        <Input label="Heure de fin" type="time" value={form.end_time ?? ''} onChange={(e) => set('end_time', e.target.value)} />
        <div className="col-span-2">
          <Input label="Lieu" value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} />
        </div>
        <Input label="Thème" value={form.theme ?? ''} onChange={(e) => set('theme', e.target.value)} placeholder="Ex: Licorne, Super-héros…" />
        <Input label="Nombre d'enfants" type="number" min="0" value={form.child_count ?? 0} onChange={(e) => set('child_count', parseInt(e.target.value) || 0)} />
        <div className="col-span-2">
          <Textarea label="Instructions" value={form.instructions ?? ''} onChange={(e) => set('instructions', e.target.value)} rows={2} />
        </div>
        <div className="col-span-2">
          <Textarea label="Notes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
        </div>
      </div>
    </Modal>
  )
}

export default function CalendarPage() {
  const qc = useQueryClient()
  const calRef = useRef<FullCalendar>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null)
  const [defaultDate, setDefaultDate] = useState('')

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => eventsApi.list() })

  const moveMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => eventsApi.update(id, { date }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })

  const filtered = events.filter((e) => typeFilter === 'all' || e.type === typeFilter)

  const calEvents = filtered.map((e) => ({
    id: e.id,
    title: e.client_name ? `${e.title} — ${e.client_name}` : e.title,
    date: e.date,
    start: e.start_time ? `${e.date}T${e.start_time}` : e.date,
    end: e.end_time ? `${e.date}T${e.end_time}` : undefined,
    color: EVENT_TYPE_CALENDAR_COLORS[e.type],
    extendedProps: { eventData: e },
  }))

  const handleEventClick = (arg: EventClickArg) => {
    const ev = arg.event.extendedProps.eventData as AppEvent
    setSelectedEvent(ev)
    setShowDetail(true)
  }

  const handleDateSelect = (arg: DateSelectArg) => {
    setDefaultDate(arg.startStr.split('T')[0])
    setEditingEvent(null)
    setShowForm(true)
  }

  const handleEventDrop = (arg: EventDropArg) => {
    const ev = arg.event.extendedProps.eventData as AppEvent
    moveMutation.mutate({ id: ev.id, date: arg.event.startStr.split('T')[0] })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex gap-2 flex-wrap">
          {FILTER_TYPES.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === f.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => { setEditingEvent(null); setDefaultDate(''); setShowForm(true) }}>
          + Ajouter un événement
        </Button>
      </div>

      {/* Legend */}
      <div className="bg-white border-b border-gray-50 px-6 py-2 flex items-center gap-4 flex-shrink-0">
        {Object.entries(EVENT_TYPE_CALENDAR_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500">{EVENT_TYPE_LABELS[type as EventType]}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-card h-full overflow-hidden">
          <div className="h-full p-4">
            <FullCalendar
              ref={calRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="fr"
              firstDay={1}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
              }}
              buttonText={{ today: "Aujourd'hui", month: 'Mois', week: 'Semaine', day: 'Jour', list: 'Liste' }}
              events={calEvents}
              eventClick={handleEventClick}
              selectable={true}
              select={handleDateSelect}
              eventDrop={handleEventDrop}
              editable={true}
              height="100%"
              eventDisplay="block"
              dayMaxEvents={3}
              moreLinkText={(n) => `+${n} autres`}
              noEventsText="Aucun événement"
            />
          </div>
        </div>
      </div>

      <EventDetailModal
        event={selectedEvent}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        onEdit={() => { setEditingEvent(selectedEvent); setShowDetail(false); setShowForm(true) }}
      />
      <EventFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        initial={editingEvent}
        defaultDate={defaultDate}
      />
    </div>
  )
}
