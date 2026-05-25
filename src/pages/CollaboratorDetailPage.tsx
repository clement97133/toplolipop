import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Phone, Mail, MapPin, Euro, Pencil, Calendar, Star, Languages } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
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
      <div className="grid grid-cols-2 gap-4">
        <Input label="Prénom" required value={form.first_name ?? ''} onChange={(e) => set('first_name', e.target.value)} />
        <Input label="Nom" required value={form.last_name ?? ''} onChange={(e) => set('last_name', e.target.value)} />
        <Select label="Rôle" required value={form.role ?? 'babysitter'} onChange={(e) => set('role', e.target.value)}
          options={Object.entries(COLLABORATOR_ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
        <Select label="Statut" value={form.status ?? 'active'} onChange={(e) => set('status', e.target.value)}
          options={[{ value: 'active', label: 'Actif' }, { value: 'inactive', label: 'Inactif' }]} />
        <Input label="Téléphone" type="tel" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
        <Input label="Email" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
        <Input label="Tarif horaire (€)" type="number" step="0.5" value={form.hourly_rate ?? ''} onChange={(e) => set('hourly_rate', parseFloat(e.target.value) || null)} />
        <div className="col-span-2">
          <Input label="Adresse" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div className="col-span-2">
          <Input label="Compétences" value={typeof form.skills === 'string' ? form.skills : parseJson<string>(form.skills).join(', ')}
            onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) as unknown as string }))}
            placeholder="Premiers secours, Animation…" />
        </div>
        <div className="col-span-2">
          <Input label="Langues" value={typeof form.languages === 'string' ? form.languages : parseJson<string>(form.languages).join(', ')}
            onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) as unknown as string }))}
            placeholder="Français, Anglais…" />
        </div>
        <div className="col-span-2">
          <Textarea label="Expérience" value={form.experience ?? ''} onChange={(e) => set('experience', e.target.value)} rows={3} />
        </div>
        <div className="col-span-2">
          <Textarea label="Notes internes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
        </div>
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
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/collaborators')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5">
        <ArrowLeft size={16} />Collaborateurs
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar firstName={collab.first_name} lastName={collab.last_name} size="xl" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{collab.first_name} {collab.last_name}</h1>
                  <Badge className={COLLABORATOR_ROLE_COLORS[collab.role as CollaboratorRole]}>
                    {COLLABORATOR_ROLE_LABELS[collab.role as CollaboratorRole]}
                  </Badge>
                </div>
              </div>
              <button onClick={() => setShowEdit(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <Pencil size={15} />
              </button>
            </div>

            <Badge className={collab.status === 'active' ? 'bg-green-100 text-green-700 mb-4' : 'bg-gray-100 text-gray-500 mb-4'} dot>
              {collab.status === 'active' ? 'Actif' : 'Inactif'}
            </Badge>

            <div className="space-y-2.5">
              {collab.phone && (
                <a href={`tel:${collab.phone}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-brand-600 transition-colors">
                  <Phone size={14} className="text-gray-400" />{collab.phone}
                </a>
              )}
              {collab.email && (
                <a href={`mailto:${collab.email}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-brand-600 transition-colors truncate">
                  <Mail size={14} className="text-gray-400 flex-shrink-0" />{collab.email}
                </a>
              )}
              {collab.address && (
                <div className="flex items-start gap-2.5 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />{collab.address}
                </div>
              )}
              {collab.hourly_rate && (
                <div className="flex items-center gap-2.5 text-sm font-semibold text-brand-600">
                  <Euro size={14} className="text-brand-400" />{formatCurrency(collab.hourly_rate)} / heure
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card padding="sm" className="text-center">
              <p className="text-xl font-bold text-brand-600">{assignments.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Missions</p>
            </Card>
            <Card padding="sm" className="text-center">
              <p className="text-xl font-bold text-green-600">
                {assignments.filter((a) => a.status === 'completed').length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Terminées</p>
            </Card>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-2">
          <Tabs tabs={tabsWithCount} active={activeTab} onChange={setActiveTab} className="mb-4" />

          {activeTab === 'profile' && (
            <div className="space-y-4">
              {skills.length > 0 && (
                <Card>
                  <CardHeader title="Compétences" />
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-brand-50 text-brand-700 text-sm rounded-lg font-medium">{s}</span>
                    ))}
                  </div>
                </Card>
              )}
              {langs.length > 0 && (
                <Card>
                  <CardHeader title="Langues" />
                  <div className="flex flex-wrap gap-2">
                    {langs.map((l) => (
                      <span key={l} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium">{l}</span>
                    ))}
                  </div>
                </Card>
              )}
              {collab.experience && (
                <Card>
                  <CardHeader title="Expérience" />
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{collab.experience}</p>
                </Card>
              )}
              {collab.notes && (
                <Card>
                  <CardHeader title="Notes internes" />
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{collab.notes}</p>
                </Card>
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
                    <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{a.event_title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {a.event_type && <Badge className={EVENT_TYPE_COLORS[a.event_type as keyof typeof EVENT_TYPE_COLORS]}>{EVENT_TYPE_LABELS[a.event_type as keyof typeof EVENT_TYPE_LABELS]}</Badge>}
                            <span className="text-xs text-gray-500">{formatDate(a.event_date)}</span>
                          </div>
                        </div>
                        <Badge className={a.status === 'completed' ? 'bg-green-100 text-green-700' : a.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}>
                          {a.status === 'completed' ? 'Terminé' : a.status === 'confirmed' ? 'Confirmé' : a.status === 'assigned' ? 'Assigné' : 'Annulé'}
                        </Badge>
                      </div>
                      {a.rate && <p className="text-xs text-brand-600 font-medium mt-2">{formatCurrency(a.rate)} / h</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <EditModal collab={collab} open={showEdit} onClose={() => setShowEdit(false)} />
    </div>
  )
}
