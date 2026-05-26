import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Phone, Mail, MapPin, Euro, Pencil, Calendar, Star, Languages } from 'lucide-react'
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
import { collaboratorsApi } from '../lib/api'
import { formatDate, formatCurrency, parseJson } from '../lib/utils'
import { COLLABORATOR_ROLE_COLORS, COLLABORATOR_ROLE_LABELS, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from '../lib/constants'
import type { Collaborator, CollaboratorRole } from '../types'

const TABS = [
  { id: 'profile', label: 'Profil', icon: <Phone size={14} /> },
  { id: 'history', label: 'Historique', icon: <Calendar size={14} /> },
]

function EditModal({ collab, open, onClose }: { collab: Collaborator; open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<Collaborator>>(collab)
  const set = (k: keyof Collaborator, v: string | number | null) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Partial<Collaborator>) => collaboratorsApi.update(collab.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collaborator', collab.id] }); onClose() },
  })

  return (
    <Modal open={open} onClose={onClose} title="Modifier le collaborateur" size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={() => mutate(form)} loading={isPending}>Enregistrer</Button></>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Prénom" required value={form.first_name ?? ''} onChange={(e) => set('first_name', e.target.value)} />
          <Input label="Nom" required value={form.last_name ?? ''} onChange={(e) => set('last_name', e.target.value)} />
          <Select label="Rôle" required value={form.role ?? 'babysitter'} onChange={(e) => set('role', e.target.value)}
            options={Object.entries(COLLABORATOR_ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <Select label="Statut" value={form.status ?? 'active'} onChange={(e) => set('status', e.target.value)}
            options={[{ value: 'active', label: 'Actif' }, { value: 'inactive', label: 'Inactif' }]} />
          <Input label="Téléphone" type="tel" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
          <Input label="Email" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          <Input label="Tarif horaire (€)" type="number" step="0.5" value={form.hourly_rate ?? ''} onChange={(e) => set('hourly_rate', parseFloat(e.target.value) || null)} />
        </div>
        <Input label="Adresse" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
        <Input label="Compétences" value={typeof form.skills === 'string' ? form.skills : parseJson<string>(form.skills).join(', ')}
          onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) as unknown as string }))}
          placeholder="Premiers secours, Animation…" />
        <Input label="Langues" value={typeof form.languages === 'string' ? form.languages : parseJson<string>(form.languages).join(', ')}
          onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) as unknown as string }))}
          placeholder="Français, Anglais…" />
        <Textarea label="Expérience" value={form.experience ?? ''} onChange={(e) => set('experience', e.target.value)} rows={3} />
        <Textarea label="Notes internes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
      </div>
    </Modal>
  )
}

export default function CollaboratorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [showEdit, setShowEdit] = useState(false)

  const { data: collab, isLoading } = useQuery({
    queryKey: ['collaborator', id],
    queryFn: () => collaboratorsApi.get(id!),
    enabled: !!id,
  })

  if (isLoading) return <PageLoader />
  if (!collab) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Collaborateur introuvable.</p>
      <Button variant="ghost" onClick={() => navigate('/collaborators')} className="mt-2"><ArrowLeft size={15} />Retour</Button>
    </div>
  )

  const skills = parseJson<string>(collab.skills)
  const langs = parseJson<string>(collab.languages)
  const assignments = collab.assignments ?? []
  const tabsWithCount = TABS.map((t) => ({ ...t, count: t.id === 'history' ? assignments.length : undefined }))

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <div className="px-5 header-top pb-5" style={{ background: 'linear-gradient(145deg, #1A2567 0%, #243580 100%)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/collaborators')} className="p-2 rounded-2xl bg-white/15 text-white hover:bg-white/25 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{collab.first_name} {collab.last_name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className={COLLABORATOR_ROLE_COLORS[collab.role as CollaboratorRole]}>
                {COLLABORATOR_ROLE_LABELS[collab.role as CollaboratorRole]}
              </Badge>
              <Badge className={collab.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-cream-200 text-navy-400'} dot>
                {collab.status === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
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
            <Avatar firstName={collab.first_name} lastName={collab.last_name} size="lg" />
            <div className="grid grid-cols-2 gap-3 flex-1">
              <div className="bg-cream-100 rounded-2xl p-3 text-center">
                <p className="text-xl font-bold text-brand-600">{assignments.length}</p>
                <p className="text-xs text-navy-400 mt-0.5">Missions</p>
              </div>
              <div className="bg-cream-100 rounded-2xl p-3 text-center">
                <p className="text-xl font-bold text-palm-500">{assignments.filter((a) => a.status === 'completed').length}</p>
                <p className="text-xs text-navy-400 mt-0.5">Terminées</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {collab.phone && (
              <a href={`tel:${collab.phone}`} className="flex items-center gap-2.5 text-sm text-navy-600 hover:text-brand-600 transition-colors">
                <Phone size={13} className="text-brand-400 flex-shrink-0" />{collab.phone}
              </a>
            )}
            {collab.email && (
              <a href={`mailto:${collab.email}`} className="flex items-center gap-2.5 text-sm text-navy-500 hover:text-brand-600 transition-colors truncate">
                <Mail size={13} className="text-navy-300 flex-shrink-0" />{collab.email}
              </a>
            )}
            {collab.address && (
              <div className="flex items-start gap-2.5 text-sm text-navy-500">
                <MapPin size={13} className="text-navy-300 mt-0.5 flex-shrink-0" />{collab.address}
              </div>
            )}
            {collab.hourly_rate && (
              <div className="flex items-center gap-2 text-sm font-bold text-brand-600">
                <Euro size={13} className="text-brand-400" />{formatCurrency(collab.hourly_rate)} / heure
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabsWithCount} active={activeTab} onChange={setActiveTab} className="mb-4" />

        {activeTab === 'profile' && (
          <div className="space-y-3">
            {skills.length > 0 && (
              <div className="bg-white rounded-3xl shadow-card p-4">
                <p className="text-xs font-bold text-navy-500 mb-2">Compétences</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => <span key={s} className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs rounded-xl font-semibold">{s}</span>)}
                </div>
              </div>
            )}
            {langs.length > 0 && (
              <div className="bg-white rounded-3xl shadow-card p-4">
                <p className="text-xs font-bold text-navy-500 mb-2">Langues</p>
                <div className="flex flex-wrap gap-1.5">
                  {langs.map((l) => <span key={l} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-xl font-semibold">{l}</span>)}
                </div>
              </div>
            )}
            {collab.experience && (
              <div className="bg-white rounded-3xl shadow-card p-4">
                <p className="text-xs font-bold text-navy-500 mb-1">Expérience</p>
                <p className="text-sm text-navy-600 whitespace-pre-wrap">{collab.experience}</p>
              </div>
            )}
            {collab.notes && (
              <div className="bg-white rounded-3xl shadow-card p-4">
                <p className="text-xs font-bold text-navy-500 mb-1">Notes internes</p>
                <p className="text-sm text-navy-600 whitespace-pre-wrap">{collab.notes}</p>
              </div>
            )}
            {!skills.length && !langs.length && !collab.experience && !collab.notes && (
              <EmptyState icon={Phone} title="Aucune information" description="Modifiez le collaborateur pour ajouter des informations." />
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {assignments.length === 0 ? (
              <EmptyState icon={Calendar} title="Aucune mission" description="Les missions apparaîtront ici." />
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div key={a.id} className="bg-white rounded-3xl shadow-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-navy-800 truncate">{a.event_title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {a.event_type && <Badge className={EVENT_TYPE_COLORS[a.event_type as keyof typeof EVENT_TYPE_COLORS]}>{EVENT_TYPE_LABELS[a.event_type as keyof typeof EVENT_TYPE_LABELS]}</Badge>}
                          <span className="text-xs text-navy-400">{formatDate(a.event_date)}</span>
                        </div>
                        {a.rate && <p className="text-xs text-brand-600 font-semibold mt-1">{formatCurrency(a.rate)} / h</p>}
                      </div>
                      <Badge className={a.status === 'completed' ? 'bg-green-100 text-green-700' : a.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-cream-200 text-navy-500'}>
                        {a.status === 'completed' ? 'Terminé' : a.status === 'confirmed' ? 'Confirmé' : a.status === 'assigned' ? 'Assigné' : 'Annulé'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-4" />
      </div>

      <EditModal collab={collab} open={showEdit} onClose={() => setShowEdit(false)} />
    </div>
  )
}
