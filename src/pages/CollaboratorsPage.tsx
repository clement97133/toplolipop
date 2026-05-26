import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserCheck, Plus, Phone, Mail, ChevronRight, Trash2, Star } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { EmptyState } from '../components/ui/EmptyState'
import { SearchInput } from '../components/ui/SearchInput'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { collaboratorsApi } from '../lib/api'
import { formatCurrency, parseJson } from '../lib/utils'
import { COLLABORATOR_ROLE_LABELS, COLLABORATOR_ROLE_COLORS } from '../lib/constants'
import type { Collaborator, CollaboratorRole } from '../types'

function CollaboratorFormModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Collaborator | null }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<Collaborator>>(initial ?? { role: 'babysitter', status: 'active' })
  const set = (k: keyof Collaborator, v: string | number | null) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Partial<Collaborator>) => initial ? collaboratorsApi.update(initial.id, d) : collaboratorsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collaborators'] }); qc.invalidateQueries({ queryKey: ['stats'] }); onClose() },
  })

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Modifier le collaborateur' : 'Nouveau collaborateur'} size="lg"
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
        <Input label="Compétences (virgule)" value={typeof form.skills === 'string' ? form.skills : parseJson<string>(form.skills).join(', ')}
          onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) as unknown as string }))}
          placeholder="Premiers secours, Animation, Cuisine…" />
        <Input label="Langues" value={typeof form.languages === 'string' ? form.languages : parseJson<string>(form.languages).join(', ')}
          onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) as unknown as string }))}
          placeholder="Français, Anglais, Espagnol…" />
        <Textarea label="Expérience" value={form.experience ?? ''} onChange={(e) => set('experience', e.target.value)} rows={2} />
        <Textarea label="Notes internes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
      </div>
    </Modal>
  )
}

export default function CollaboratorsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)

  const { data = [], isLoading } = useQuery({ queryKey: ['collaborators'], queryFn: () => collaboratorsApi.list() })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => collaboratorsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collaborators'] }); qc.invalidateQueries({ queryKey: ['stats'] }) },
  })

  const filtered = data.filter((c) => {
    const matchRole = roleFilter === 'all' || c.role === roleFilter
    const matchSearch = `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header marine */}
      <div
        className="px-5 pt-12 pb-6"
        style={{ background: 'linear-gradient(145deg, #1A2567 0%, #243580 100%)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Collaborateurs</h1>
            <p className="text-sm text-navy-200 mt-0.5">{filtered.length} collaborateur{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm"><Plus size={15} />Nouveau</Button>
        </div>
      </div>

      <div className="px-4 py-5 max-w-7xl mx-auto">

      <div className="flex flex-col gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher…" className="w-full" />
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={[{ value: 'all', label: 'Tous les rôles' }, ...Object.entries(COLLABORATOR_ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))]}
          className="w-full"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title={search || roleFilter !== 'all' ? 'Aucun résultat' : 'Aucun collaborateur'}
          description={search || roleFilter !== 'all' ? "Essayez d'autres filtres." : "Ajoutez votre première équipe."}
          action={!search && roleFilter === 'all' ? <Button onClick={() => setShowForm(true)}><Plus size={15} />Ajouter</Button> : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => {
            const skills = parseJson<string>(c.skills)
            const langs = parseJson<string>(c.languages)
            return (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-cream-300/60 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/collaborators/${c.id}`)}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar firstName={c.first_name} lastName={c.last_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-navy-800 truncate">{c.first_name} {c.last_name}</p>
                        <ChevronRight size={15} className="text-navy-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge className={COLLABORATOR_ROLE_COLORS[c.role as CollaboratorRole]}>{COLLABORATOR_ROLE_LABELS[c.role as CollaboratorRole]}</Badge>
                        <Badge className={c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-cream-200 text-navy-400'} dot>
                          {c.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {c.phone && (
                      <div className="flex items-center gap-2 text-xs text-navy-500">
                        <Phone size={11} className="flex-shrink-0 text-brand-400" />{c.phone}
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-2 text-xs text-navy-400 truncate">
                        <Mail size={11} className="flex-shrink-0 text-navy-300" />{c.email}
                      </div>
                    )}
                    {c.hourly_rate && (
                      <p className="text-xs font-bold text-brand-600">{formatCurrency(c.hourly_rate)} / h</p>
                    )}
                  </div>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {skills.slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] bg-cream-200 text-navy-600 px-2 py-0.5 rounded-full font-medium">{s}</span>
                      ))}
                      {skills.length > 3 && <span className="text-[10px] text-navy-400">+{skills.length - 3}</span>}
                    </div>
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-cream-200 flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('Supprimer ce collaborateur ?')) deleteMutation.mutate(c.id) }}
                    className="p-1.5 rounded-xl hover:bg-red-50 text-navy-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CollaboratorFormModal open={showForm} onClose={() => setShowForm(false)} />
      </div>
    </div>
  )
}
