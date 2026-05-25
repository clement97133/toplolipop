import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Baby, Package, Tag, FileText, Plus, Pencil, Trash2, Euro, Star } from 'lucide-react'
import { Tabs } from '../components/ui/Tabs'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { SearchInput } from '../components/ui/SearchInput'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { collaboratorsApi, equipmentApi, pricingApi, documentsApi, statsApi } from '../lib/api'
import { formatCurrency, formatDate, parseJson } from '../lib/utils'
import {
  COLLABORATOR_ROLE_COLORS, COLLABORATOR_ROLE_LABELS,
  EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_STATUS_COLORS, EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CONDITION_LABELS, DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_COLORS,
  DOCUMENT_STATUS_LABELS, PRICING_UNIT_LABELS,
} from '../lib/constants'
import type { Collaborator, Equipment, Pricing, AppDocument, EquipmentCategory, DocumentStatus, CollaboratorRole } from '../types'

const TABS = [
  { id: 'babysitters', label: 'Baby-sitters', icon: <Baby size={15} /> },
  { id: 'equipment', label: 'Matériel', icon: <Package size={15} /> },
  { id: 'pricing', label: 'Tarifs', icon: <Tag size={15} /> },
  { id: 'documents', label: 'Devis & Factures', icon: <FileText size={15} /> },
]

// ─── Stats Banner ─────────────────────────────────────────────────────────────
function StatsBanner() {
  const { data } = useQuery({ queryKey: ['stats'], queryFn: statsApi.get })
  if (!data) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Clients', value: data.clients, color: 'text-brand-600' },
        { label: 'Événements', value: data.events, color: 'text-blue-600' },
        { label: 'Matériel dispo', value: data.availableEquipment, color: 'text-green-600' },
        { label: 'Collaborateurs', value: data.activeCollaborators, color: 'text-rose-500' },
      ].map((s) => (
        <Card key={s.label} padding="md">
          <p className="text-xs text-gray-500 mb-1">{s.label}</p>
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
        </Card>
      ))}
    </div>
  )
}

// ─── Babysitters Section ───────────────────────────────────────────────────────
function BabysittersSection() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<Collaborator | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data = [], isLoading } = useQuery({
    queryKey: ['collaborators', 'babysitter'],
    queryFn: () => collaboratorsApi.list('babysitter'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => collaboratorsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collaborators'] }),
  })

  const filtered = data.filter((c) =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = (c: Collaborator) => { setEditTarget(c); setShowForm(true) }
  const openNew = () => { setEditTarget(null); setShowForm(true) }

  if (isLoading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} className="flex-1 max-w-xs" />
        <Button onClick={openNew} size="sm"><Plus size={15} />Ajouter</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Baby} title="Aucune baby-sitter" description="Ajoutez votre première baby-sitter / nounou." action={<Button onClick={openNew} size="sm"><Plus size={14} />Ajouter</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} hover>
              <div className="flex items-start gap-3">
                <Avatar firstName={c.first_name} lastName={c.last_name} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900 truncate">{c.first_name} {c.last_name}</p>
                    <Badge className={c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                      {c.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {c.phone && <p className="text-xs text-gray-500 mt-0.5">{c.phone}</p>}
                  {c.email && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                  {c.hourly_rate && (
                    <p className="text-xs font-medium text-brand-600 mt-1">{formatCurrency(c.hourly_rate)} / h</p>
                  )}
                  {parseJson(c.skills).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {parseJson<string>(c.skills).slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { if (confirm('Supprimer cette baby-sitter ?')) deleteMutation.mutate(c.id) }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CollaboratorFormModal open={showForm} onClose={() => setShowForm(false)} initial={editTarget} forceRole="babysitter" />
    </div>
  )
}

// ─── Equipment Section ────────────────────────────────────────────────────────
function EquipmentSection() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [editTarget, setEditTarget] = useState<Equipment | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data = [], isLoading } = useQuery({ queryKey: ['equipment'], queryFn: equipmentApi.list })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => equipmentApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  })

  const categories = [...new Set(data.map((e) => e.category))]
  const filtered = data.filter((e) => {
    const matchCat = catFilter === 'all' || e.category === catFilter
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  if (isLoading) return <PageLoader />

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} className="flex-1 max-w-xs" />
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catFilter === cat ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {cat === 'all' ? 'Tout' : EQUIPMENT_CATEGORY_LABELS[cat as EquipmentCategory]}
            </button>
          ))}
        </div>
        <Button onClick={() => { setEditTarget(null); setShowForm(true) }} size="sm"><Plus size={15} />Ajouter</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="Aucun matériel" description="Ajoutez votre premier équipement." action={<Button onClick={() => setShowForm(true)} size="sm"><Plus size={14} />Ajouter</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((eq) => (
            <Card key={eq.id} hover>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{eq.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{EQUIPMENT_CATEGORY_LABELS[eq.category]}</p>
                </div>
                <Badge className={EQUIPMENT_STATUS_COLORS[eq.status]}>
                  {EQUIPMENT_STATUS_LABELS[eq.status]}
                </Badge>
              </div>
              <div className="space-y-1">
                {eq.rental_price && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Euro size={12} className="text-green-500" />
                    {formatCurrency(eq.rental_price)} / location
                  </div>
                )}
                {eq.deposit_amount && (
                  <p className="text-xs text-gray-400">Caution : {formatCurrency(eq.deposit_amount)}</p>
                )}
                <p className="text-xs text-gray-400">État : {EQUIPMENT_CONDITION_LABELS[eq.condition]}</p>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
                <button onClick={() => { setEditTarget(eq); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { if (confirm('Supprimer cet équipement ?')) deleteMutation.mutate(eq.id) }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <EquipmentFormModal open={showForm} onClose={() => setShowForm(false)} initial={editTarget} />
    </div>
  )
}

// ─── Pricing Section ──────────────────────────────────────────────────────────
function PricingSection() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Pricing | null>(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['pricing'], queryFn: pricingApi.list })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => pricingApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing'] }),
  })

  const grouped = data.reduce<Record<string, Pricing[]>>((acc, p) => {
    acc[p.category] = acc[p.category] ?? []
    acc[p.category].push(p)
    return acc
  }, {})

  const catLabels: Record<string, string> = { babysitting: 'Baby-sitting', event: 'Événements', equipment: 'Location matériel', special: 'Tarifs spéciaux' }

  if (isLoading) return <PageLoader />

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditTarget(null); setShowForm(true) }} size="sm"><Plus size={15} />Ajouter un tarif</Button>
      </div>

      {data.length === 0 ? (
        <EmptyState icon={Tag} title="Aucun tarif configuré" description="Configurez vos grilles tarifaires." action={<Button onClick={() => setShowForm(true)} size="sm"><Plus size={14} />Ajouter</Button>} />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-brand-500 inline-block" />
                {catLabels[cat] ?? cat}
              </h3>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Nom', 'Prix', 'Unité', 'Conditions', ''].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(p.price)}</td>
                        <td className="px-4 py-3 text-gray-500">/{PRICING_UNIT_LABELS[p.unit] ?? p.unit}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{p.conditions ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => { setEditTarget(p); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => { if (confirm('Supprimer ce tarif ?')) deleteMutation.mutate(p.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      <PricingFormModal open={showForm} onClose={() => setShowForm(false)} initial={editTarget} />
    </div>
  )
}

// ─── Documents Section ────────────────────────────────────────────────────────
function DocumentsSection() {
  const { data = [], isLoading } = useQuery({ queryKey: ['documents'], queryFn: () => documentsApi.list() })
  const qc = useQueryClient()
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })

  const filtered = data.filter((d) => {
    const matchType = typeFilter === 'all' || d.type === typeFilter
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchType && matchStatus
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DocumentStatus }) => documentsApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="flex gap-1.5">
          {['all', 'quote', 'invoice', 'contract'].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === t ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {t === 'all' ? 'Tous' : DOCUMENT_TYPE_LABELS[t as keyof typeof DOCUMENT_TYPE_LABELS]}
            </button>
          ))}
        </div>
        <Select
          options={[
            { value: 'all', label: 'Tous statuts' },
            ...['draft', 'sent', 'accepted', 'paid', 'cancelled'].map((s) => ({ value: s, label: DOCUMENT_STATUS_LABELS[s as DocumentStatus] }))
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Aucun document" description="Les devis et factures apparaîtront ici." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Numéro', 'Type', 'Client', 'Montant', 'Statut', 'Date', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">{doc.number}</td>
                  <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-600">{DOCUMENT_TYPE_LABELS[doc.type]}</Badge></td>
                  <td className="px-4 py-3 text-gray-700">{doc.client_name ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(doc.total)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={doc.status}
                      onChange={(e) => updateStatus.mutate({ id: doc.id, status: e.target.value as DocumentStatus })}
                      className={`text-xs rounded-full px-2 py-1 font-medium border-0 cursor-pointer ${DOCUMENT_STATUS_COLORS[doc.status]}`}
                    >
                      {(['draft', 'sent', 'accepted', 'paid', 'cancelled'] as DocumentStatus[]).map((s) => (
                        <option key={s} value={s}>{DOCUMENT_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(doc.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { if (confirm('Supprimer ce document ?')) deleteMutation.mutate(doc.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Form Modals ──────────────────────────────────────────────────────────────
function CollaboratorFormModal({ open, onClose, initial, forceRole }: { open: boolean; onClose: () => void; initial: Collaborator | null; forceRole?: string }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<Collaborator>>({})

  const set = (k: keyof Collaborator, v: string | number | null) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Partial<Collaborator>) =>
      initial ? collaboratorsApi.update(initial.id, d) : collaboratorsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collaborators'] }); qc.invalidateQueries({ queryKey: ['stats'] }); onClose() },
  })

  const handleOpen = () => {
    setForm(initial ? { ...initial, role: (initial.role || forceRole || 'babysitter') as CollaboratorRole } : { role: (forceRole || 'babysitter') as CollaboratorRole, status: 'active' })
  }

  const submit = () => mutate({ ...form, role: (form.role ?? forceRole ?? 'babysitter') as CollaboratorRole })

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Modifier la baby-sitter' : 'Nouvelle baby-sitter'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={isPending}>Enregistrer</Button></>}
    >
      <div className="grid grid-cols-2 gap-4" onMouseEnter={!form.first_name && !initial ? handleOpen : undefined}>
        <Input label="Prénom" required value={form.first_name ?? ''} onChange={(e) => set('first_name', e.target.value)} />
        <Input label="Nom" required value={form.last_name ?? ''} onChange={(e) => set('last_name', e.target.value)} />
        <Input label="Téléphone" type="tel" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
        <Input label="Email" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
        <Input label="Tarif horaire (€)" type="number" step="0.5" value={form.hourly_rate ?? ''} onChange={(e) => set('hourly_rate', parseFloat(e.target.value) || null)} />
        <Select label="Statut" value={form.status ?? 'active'} onChange={(e) => set('status', e.target.value)} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        <div className="col-span-2">
          <Input label="Compétences (séparées par virgule)" value={typeof form.skills === 'string' ? form.skills : parseJson<string>(form.skills).join(', ')} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) as unknown as string }))} placeholder="Ex: Secourisme, Jeux éducatifs, Cuisine…" />
        </div>
        <div className="col-span-2">
          <Input label="Langues parlées" value={typeof form.languages === 'string' ? form.languages : parseJson<string>(form.languages).join(', ')} onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) as unknown as string }))} placeholder="Ex: Français, Anglais…" />
        </div>
        <div className="col-span-2">
          <Textarea label="Expérience" value={form.experience ?? ''} onChange={(e) => set('experience', e.target.value)} rows={2} />
        </div>
        <div className="col-span-2">
          <Textarea label="Notes internes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
        </div>
      </div>
    </Modal>
  )
}

function EquipmentFormModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: Equipment | null }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<Equipment>>(initial ?? { status: 'available', condition: 'good', category: 'inflatable' })
  const set = (k: keyof Equipment, v: string | number | null) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Partial<Equipment>) => initial ? equipmentApi.update(initial.id, d) : equipmentApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); onClose() },
  })

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Modifier le matériel' : 'Nouveau matériel'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={() => mutate(form)} loading={isPending}>Enregistrer</Button></>}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Nom" required value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
        </div>
        <Select label="Catégorie" required value={form.category ?? 'inflatable'} onChange={(e) => set('category', e.target.value)}
          options={Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
        <Select label="Statut" value={form.status ?? 'available'} onChange={(e) => set('status', e.target.value)}
          options={Object.entries(EQUIPMENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
        <Select label="État" value={form.condition ?? 'good'} onChange={(e) => set('condition', e.target.value)}
          options={Object.entries(EQUIPMENT_CONDITION_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
        <Input label="Prix de location (€)" type="number" step="0.5" value={form.rental_price ?? ''} onChange={(e) => set('rental_price', parseFloat(e.target.value) || null)} />
        <Input label="Caution (€)" type="number" step="0.5" value={form.deposit_amount ?? ''} onChange={(e) => set('deposit_amount', parseFloat(e.target.value) || null)} />
        <Input label="Prix d'achat (€)" type="number" value={form.purchase_price ?? ''} onChange={(e) => set('purchase_price', parseFloat(e.target.value) || null)} />
        <div className="col-span-2">
          <Textarea label="Description" value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={2} />
        </div>
        <div className="col-span-2">
          <Textarea label="Notes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
        </div>
      </div>
    </Modal>
  )
}

function PricingFormModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: Pricing | null }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<Pricing>>(initial ?? { category: 'babysitting', unit: 'hour', active: 1 })
  const set = (k: keyof Pricing, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Partial<Pricing>) => initial ? pricingApi.update(initial.id, d) : pricingApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pricing'] }); onClose() },
  })

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Modifier le tarif' : 'Nouveau tarif'}
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={() => mutate(form)} loading={isPending}>Enregistrer</Button></>}
    >
      <div className="space-y-4">
        <Select label="Catégorie" required value={form.category ?? 'babysitting'} onChange={(e) => set('category', e.target.value)}
          options={[{ value: 'babysitting', label: 'Baby-sitting' }, { value: 'event', label: 'Événement' }, { value: 'equipment', label: 'Location matériel' }, { value: 'special', label: 'Tarif spécial' }]} />
        <Input label="Nom du tarif" required value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Tarif nuit, Tarif week-end…" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Prix (€)" required type="number" step="0.5" value={form.price ?? ''} onChange={(e) => set('price', parseFloat(e.target.value) || 0)} />
          <Select label="Par" value={form.unit ?? 'hour'} onChange={(e) => set('unit', e.target.value)}
            options={[{ value: 'hour', label: 'Heure' }, { value: 'day', label: 'Journée' }, { value: 'event', label: 'Événement' }, { value: 'flat', label: 'Forfait' }]} />
        </div>
        <Textarea label="Conditions" value={form.conditions ?? ''} onChange={(e) => set('conditions', e.target.value)} rows={2} placeholder="Conditions d'application…" />
        <Textarea label="Description" value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={2} />
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GeneralPage() {
  const [activeTab, setActiveTab] = useState('babysitters')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Général</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble et gestion des ressources</p>
      </div>

      <StatsBanner />

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'babysitters' && <BabysittersSection />}
      {activeTab === 'equipment' && <EquipmentSection />}
      {activeTab === 'pricing' && <PricingSection />}
      {activeTab === 'documents' && <DocumentsSection />}
    </div>
  )
}
