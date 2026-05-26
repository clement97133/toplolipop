import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Phone, Mail, MapPin, Pencil, Plus, Calendar, FileText, Package, Baby, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Tabs } from '../components/ui/Tabs'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { clientsApi, eventsApi, documentsApi } from '../lib/api'
import { formatDate, formatCurrency, parseJson } from '../lib/utils'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, EVENT_STATUS_COLORS, EVENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_COLORS, DOCUMENT_STATUS_LABELS } from '../lib/constants'
import type { Client, Event } from '../types'

const DETAIL_TABS = [
  { id: 'info', label: 'Informations', icon: <Phone size={14} /> },
  { id: 'events', label: 'Événements', icon: <Calendar size={14} /> },
  { id: 'documents', label: 'Documents', icon: <FileText size={14} /> },
]

function EditClientModal({ client, open, onClose }: { client: Client; open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<Client>>(client)
  const [tagsInput, setTagsInput] = useState(parseJson<string>(client.tags).join(', '))
  const set = (k: keyof Client, v: string | null) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Partial<Client>) => clientsApi.update(client.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client', client.id] }); onClose() },
  })

  const submit = () => {
    const tags = tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : []
    mutate({ ...form, tags })
  }

  return (
    <Modal open={open} onClose={onClose} title="Modifier le client" size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={isPending}>Enregistrer</Button></>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Prénom" required value={form.first_name ?? ''} onChange={(e) => set('first_name', e.target.value)} />
          <Input label="Nom" required value={form.last_name ?? ''} onChange={(e) => set('last_name', e.target.value)} />
          <Input label="Téléphone" type="tel" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
          <Input label="Email" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
        </div>
        <Input label="Adresse" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
        <Input label="Adresse événement" value={form.event_address ?? ''} onChange={(e) => set('event_address', e.target.value)} />
        <Input label="Tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="VIP, Fidèle, Particulier…" />
        <Textarea label="Notes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={3} />
        <Textarea label="Préférences" value={form.preferences ?? ''} onChange={(e) => set('preferences', e.target.value)} rows={2} />
      </div>
    </Modal>
  )
}

function EventFormModal({ clientId, open, onClose }: { clientId: string; open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<Event>>({ client_id: clientId, status: 'pending', type: 'animation', child_count: 0 })
  const set = (k: keyof Event, v: string | number | null) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Partial<Event>) => eventsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events', 'client', clientId] })
      qc.invalidateQueries({ queryKey: ['events'] })
      onClose()
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Nouvel événement" size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={() => mutate(form)} loading={isPending}>Créer</Button></>}
    >
      <div className="space-y-4">
        <Input label="Titre de l'événement" required value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} placeholder="Ex: Anniversaire de Lucas" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Type" required value={form.type ?? 'animation'} onChange={(e) => set('type', e.target.value)}
            options={[{ value: 'animation', label: 'Animation' }, { value: 'babysitting', label: 'Baby-sitting' }, { value: 'rental', label: 'Location' }, { value: 'delivery', label: 'Livraison' }, { value: 'other', label: 'Autre' }]} />
          <Select label="Statut" value={form.status ?? 'pending'} onChange={(e) => set('status', e.target.value)}
            options={[{ value: 'pending', label: 'En attente' }, { value: 'confirmed', label: 'Confirmé' }, { value: 'in_progress', label: 'En cours' }, { value: 'completed', label: 'Terminé' }, { value: 'cancelled', label: 'Annulé' }]} />
          <Input label="Date" required type="date" value={form.date ?? ''} onChange={(e) => set('date', e.target.value)} />
          <Input label="Nombre d'enfants" type="number" value={form.child_count ?? 0} onChange={(e) => set('child_count', parseInt(e.target.value) || 0)} />
          <Input label="Heure de début" type="time" value={form.start_time ?? ''} onChange={(e) => set('start_time', e.target.value)} />
          <Input label="Heure de fin" type="time" value={form.end_time ?? ''} onChange={(e) => set('end_time', e.target.value)} />
        </div>
        <Input label="Lieu" value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} />
        <Input label="Thème" value={form.theme ?? ''} onChange={(e) => set('theme', e.target.value)} placeholder="Ex: Super-héros, Princesse…" />
        <Textarea label="Instructions spécifiques" value={form.instructions ?? ''} onChange={(e) => set('instructions', e.target.value)} rows={2} />
        <Textarea label="Notes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
      </div>
    </Modal>
  )
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('info')
  const [showEdit, setShowEdit] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.get(id!),
    enabled: !!id,
  })

  const { data: events = [] } = useQuery({
    queryKey: ['events', 'client', id],
    queryFn: () => eventsApi.list({ client_id: id }),
    enabled: !!id,
  })

  const { data: docs = [] } = useQuery({
    queryKey: ['documents', 'client', id],
    queryFn: () => documentsApi.list(id),
    enabled: !!id,
  })

  if (isLoading) return <PageLoader />
  if (!client) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Client introuvable.</p>
      <Button variant="ghost" onClick={() => navigate('/clients')} className="mt-2"><ArrowLeft size={15} />Retour</Button>
    </div>
  )

  const tags = parseJson<string>(client.tags)
  const upcoming = events.filter((e) => new Date(e.date) >= new Date()).length
  const tabsWithCount = DETAIL_TABS.map((t) => ({
    ...t,
    count: t.id === 'events' ? events.length : t.id === 'documents' ? docs.length : undefined,
  }))

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <div className="px-5 header-top pb-5" style={{ background: 'linear-gradient(145deg, #1A2567 0%, #243580 100%)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/clients')} className="p-2 rounded-2xl bg-white/15 text-white hover:bg-white/25 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{client.first_name} {client.last_name}</h1>
            <p className="text-xs text-navy-200 mt-0.5">Depuis le {formatDate(client.created_at)}</p>
          </div>
          <button onClick={() => setShowEdit(true)} className="p-2 rounded-2xl bg-white/15 text-white hover:bg-white/25 transition-colors">
            <Pencil size={16} />
          </button>
        </div>
      </div>

      <div className="px-4 py-5 max-w-5xl mx-auto">

        {/* Infos contact */}
        <div className="bg-white rounded-3xl shadow-card p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar firstName={client.first_name} lastName={client.last_name} size="lg" />
            <div className="flex-1 min-w-0">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {tags.map((tag) => <Badge key={tag} className="bg-brand-50 text-brand-600 text-[10px]">{tag}</Badge>)}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-brand-600">{events.length} événement{events.length !== 1 ? 's' : ''}</span>
                {upcoming > 0 && <span className="text-xs text-navy-400">· {upcoming} à venir</span>}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {client.phone && (
              <a href={`tel:${client.phone}`} className="flex items-center gap-2.5 text-sm text-navy-600 hover:text-brand-600 transition-colors">
                <Phone size={13} className="text-brand-400 flex-shrink-0" />{client.phone}
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-2.5 text-sm text-navy-500 hover:text-brand-600 transition-colors truncate">
                <Mail size={13} className="text-navy-300 flex-shrink-0" />{client.email}
              </a>
            )}
            {client.address && (
              <div className="flex items-start gap-2.5 text-sm text-navy-500">
                <MapPin size={13} className="text-navy-300 mt-0.5 flex-shrink-0" />{client.address}
              </div>
            )}
          </div>
          {client.notes && (
            <div className="mt-3 pt-3 border-t border-cream-200">
              <p className="text-xs font-bold text-navy-500 mb-1">Notes</p>
              <p className="text-sm text-navy-600 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs tabs={tabsWithCount} active={activeTab} onChange={setActiveTab} className="mb-4" />

        {activeTab === 'info' && (
          <div className="space-y-3">
            {client.event_address && (
              <div className="bg-white rounded-3xl shadow-card p-4">
                <p className="text-xs font-bold text-navy-500 mb-1">Adresse des événements</p>
                <p className="text-sm text-navy-700">{client.event_address}</p>
              </div>
            )}
            {client.preferences && (
              <div className="bg-white rounded-3xl shadow-card p-4">
                <p className="text-xs font-bold text-navy-500 mb-1">Préférences</p>
                <p className="text-sm text-navy-600 whitespace-pre-wrap">{client.preferences}</p>
              </div>
            )}
            {!client.event_address && !client.preferences && (
              <EmptyState icon={Phone} title="Aucune information supplémentaire" description="Modifiez le client pour ajouter des informations." />
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => setShowEventForm(true)}><Plus size={14} />Ajouter</Button>
            </div>
            {events.length === 0 ? (
              <EmptyState icon={Calendar} title="Aucun événement" description="Ajoutez le premier événement de ce client."
                action={<Button size="sm" onClick={() => setShowEventForm(true)}><Plus size={14} />Ajouter</Button>} />
            ) : (
              <div className="space-y-2">
                {events.map((ev) => (
                  <div key={ev.id} className="bg-white rounded-3xl shadow-card p-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-navy-800 truncate">{ev.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={EVENT_TYPE_COLORS[ev.type]}>{EVENT_TYPE_LABELS[ev.type]}</Badge>
                          <Badge className={EVENT_STATUS_COLORS[ev.status]}>{EVENT_STATUS_LABELS[ev.status]}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-navy-400">
                          <span>{formatDate(ev.date)}</span>
                          {ev.start_time && <span>{ev.start_time}{ev.end_time ? ` → ${ev.end_time}` : ''}</span>}
                          {ev.location && <span className="flex items-center gap-1"><MapPin size={10} />{ev.location}</span>}
                        </div>
                        {ev.theme && <p className="text-xs text-brand-500 mt-1">Thème : {ev.theme}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            {docs.length === 0 ? (
              <EmptyState icon={FileText} title="Aucun document" description="Les devis et factures apparaîtront ici." />
            ) : (
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-3xl shadow-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-navy-500 bg-cream-100 px-2 py-0.5 rounded-lg">{doc.number || '—'}</span>
                          <Badge className="bg-cream-200 text-navy-600">{DOCUMENT_TYPE_LABELS[doc.type]}</Badge>
                          <Badge className={DOCUMENT_STATUS_COLORS[doc.status]}>{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
                        </div>
                        {doc.title && <p className="text-sm font-medium text-navy-700 mt-1 truncate">{doc.title}</p>}
                      </div>
                      <p className="text-base font-bold text-navy-800 flex-shrink-0">{formatCurrency(doc.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-4" />
      </div>

      <EditClientModal client={client} open={showEdit} onClose={() => setShowEdit(false)} />
      <EventFormModal clientId={id!} open={showEventForm} onClose={() => setShowEventForm(false)} />
    </div>
  )
}
