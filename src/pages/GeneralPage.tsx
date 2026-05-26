import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Package, Tag, FileText, Plus, Pencil, Trash2, Euro,
  User, Building2, Mail, Phone, Bell, ChevronRight,
  Settings, Info, Check, X,
} from 'lucide-react'
import { Tabs } from '../components/ui/Tabs'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { equipmentApi, pricingApi, documentsApi } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'
import {
  EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_STATUS_COLORS, EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_CONDITION_LABELS, DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_COLORS,
  DOCUMENT_STATUS_LABELS, PRICING_UNIT_LABELS,
} from '../lib/constants'
import type { Equipment, Pricing, AppDocument, EquipmentCategory, DocumentStatus } from '../types'

// ─── Profil (localStorage) ────────────────────────────────────────────────────
const PROFILE_KEY = 'toplolipop_profile'
interface UserProfile {
  name: string
  company: string
  email: string
  phone: string
  notifEvents: boolean
  notifReminders: boolean
}
const DEFAULT_PROFILE: UserProfile = {
  name: '', company: 'TOPLOLIPOP Art & Events', email: '', phone: '',
  notifEvents: true, notifReminders: true,
}
function loadProfile(): UserProfile {
  try { return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem(PROFILE_KEY) ?? '{}') } }
  catch { return DEFAULT_PROFILE }
}
function saveProfile(p: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
}

// ─── Initiales avatar ─────────────────────────────────────────────────────────
function ProfileAvatar({ name }: { name: string }) {
  const parts = name.trim().split(' ').filter(Boolean)
  const ini   = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (name.substring(0, 2).toUpperCase() || '🌟')
  return (
    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-btn text-white text-2xl font-bold flex-shrink-0">
      {ini}
    </div>
  )
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`toggle-track ${value ? 'bg-brand-500' : 'bg-cream-300'}`}
    >
      <span className={`toggle-thumb ${value ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  )
}

// ─── Section Profil ───────────────────────────────────────────────────────────
function ProfileSection() {
  const [profile, setProfile] = useState<UserProfile>(loadProfile)
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState<UserProfile>(profile)

  const save = () => {
    saveProfile(draft)
    setProfile(draft)
    setEditing(false)
  }
  const cancel = () => { setDraft(profile); setEditing(false) }

  const fields: { key: keyof UserProfile; label: string; icon: React.ElementType; type?: string; placeholder: string }[] = [
    { key: 'name',    label: 'Nom complet',   icon: User,      placeholder: 'Votre nom…' },
    { key: 'company', label: 'Entreprise',    icon: Building2, placeholder: 'Nom de votre société…' },
    { key: 'email',   label: 'Email',         icon: Mail,      type: 'email', placeholder: 'contact@toplolipop.com' },
    { key: 'phone',   label: 'Téléphone',     icon: Phone,     type: 'tel',   placeholder: '+590 690 …' },
  ]

  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      {/* En-tête profil */}
      <div
        className="px-5 py-6 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, #FDF8EC 0%, #FAF0CC 100%)' }}
      >
        <ProfileAvatar name={profile.name || profile.company} />
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-navy-800 truncate">
            {profile.name || 'Mon profil'}
          </p>
          <p className="text-sm text-navy-500 truncate">{profile.company}</p>
          {profile.email && (
            <p className="text-xs text-navy-400 mt-0.5 truncate">{profile.email}</p>
          )}
        </div>
        {!editing && (
          <button
            onClick={() => { setDraft(profile); setEditing(true) }}
            className="p-2.5 rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-all text-navy-500"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      {/* Formulaire édition */}
      {editing ? (
        <div className="p-5 space-y-4">
          {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-brand-500" />
              </div>
              <div className="flex-1">
                <Input
                  label={label}
                  type={type}
                  placeholder={placeholder}
                  value={draft[key] as string}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                />
              </div>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={cancel} className="flex-1">
              <X size={15} />Annuler
            </Button>
            <Button onClick={save} className="flex-1">
              <Check size={15} />Enregistrer
            </Button>
          </div>
        </div>
      ) : (
        /* Lecture seule — lignes cliquables */
        <div className="divide-y divide-cream-100">
          {fields.map(({ key, label, icon: Icon, placeholder }) => {
            const val = profile[key] as string
            return (
              <button
                key={key}
                onClick={() => { setDraft(profile); setEditing(true) }}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-cream-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-navy-400 font-medium">{label}</p>
                  <p className={`text-sm font-semibold truncate ${val ? 'text-navy-700' : 'text-navy-300'}`}>
                    {val || placeholder}
                  </p>
                </div>
                <ChevronRight size={14} className="text-navy-300 flex-shrink-0" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Section Préférences / Notifications ─────────────────────────────────────
function PreferencesSection() {
  const [profile, setProfile] = useState<UserProfile>(loadProfile)

  const toggle = (key: 'notifEvents' | 'notifReminders') => {
    const updated = { ...profile, [key]: !profile[key] }
    saveProfile(updated)
    setProfile(updated)
  }

  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-cream-100">
        <p className="text-sm font-bold text-navy-700 flex items-center gap-2">
          <Bell size={15} className="text-brand-500" />
          Notifications
        </p>
      </div>
      <div className="divide-y divide-cream-100">
        {[
          { key: 'notifEvents' as const,    label: 'Nouveaux événements',  sub: 'Alerte lors d\'une nouvelle réservation' },
          { key: 'notifReminders' as const, label: 'Rappels d\'échéances', sub: 'Rappels avant vos événements' },
        ].map(({ key, label, sub }) => (
          <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
            <div>
              <p className="text-sm font-semibold text-navy-700">{label}</p>
              <p className="text-xs text-navy-400 mt-0.5">{sub}</p>
            </div>
            <Toggle value={profile[key]} onChange={() => toggle(key)} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Equipment Section ────────────────────────────────────────────────────────
function EquipmentSection() {
  const qc = useQueryClient()
  const [editTarget, setEditTarget] = useState<Equipment | null>(null)
  const [showForm,   setShowForm]   = useState(false)

  const { data = [], isLoading } = useQuery({ queryKey: ['equipment'], queryFn: equipmentApi.list })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => equipmentApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={() => { setEditTarget(null); setShowForm(true) }} size="sm">
          <Plus size={14} />Ajouter
        </Button>
      </div>

      {data.length === 0 ? (
        <EmptyState icon={Package} title="Aucun matériel" description="Ajoutez votre premier équipement."
          action={<Button onClick={() => setShowForm(true)} size="sm"><Plus size={14} />Ajouter</Button>} />
      ) : (
        <div className="space-y-2">
          {data.map((eq) => (
            <div key={eq.id} className="bg-white rounded-2xl shadow-card p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-bold text-sm text-navy-800 truncate">{eq.name}</p>
                  <Badge className={EQUIPMENT_STATUS_COLORS[eq.status]}>
                    {EQUIPMENT_STATUS_LABELS[eq.status]}
                  </Badge>
                </div>
                <p className="text-xs text-navy-400">{EQUIPMENT_CATEGORY_LABELS[eq.category as EquipmentCategory]}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                  {eq.rental_price && (
                    <span className="flex items-center gap-1 text-xs text-palm-500 font-semibold">
                      <Euro size={11} />{formatCurrency(eq.rental_price)} / location
                    </span>
                  )}
                  {eq.deposit_amount && (
                    <span className="text-xs text-navy-400">Caution : {formatCurrency(eq.deposit_amount)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => { setEditTarget(eq); setShowForm(true) }}
                  className="p-2 rounded-xl hover:bg-cream-100 text-navy-400 hover:text-navy-600 transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => { if (confirm('Supprimer cet équipement ?')) deleteMutation.mutate(eq.id) }}
                  className="p-2 rounded-xl hover:bg-red-50 text-navy-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
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
  const [showForm,   setShowForm]   = useState(false)
  const [editTarget, setEditTarget] = useState<Pricing | null>(null)

  const { data = [], isLoading } = useQuery({ queryKey: ['pricing'], queryFn: pricingApi.list })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => pricingApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing'] }),
  })

  const catLabels: Record<string, string> = {
    babysitting: 'Baby-sitting', event: 'Événements',
    equipment: 'Location matériel', special: 'Tarifs spéciaux',
  }

  const grouped = data.reduce<Record<string, Pricing[]>>((acc, p) => {
    acc[p.category] = acc[p.category] ?? []
    acc[p.category].push(p)
    return acc
  }, {})

  if (isLoading) return <PageLoader />

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={() => { setEditTarget(null); setShowForm(true) }} size="sm">
          <Plus size={14} />Ajouter un tarif
        </Button>
      </div>

      {data.length === 0 ? (
        <EmptyState icon={Tag} title="Aucun tarif configuré" description="Configurez vos grilles tarifaires."
          action={<Button onClick={() => setShowForm(true)} size="sm"><Plus size={14} />Ajouter</Button>} />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-1 h-4 rounded-full bg-brand-500" />
                <h4 className="text-xs font-bold text-navy-500 uppercase tracking-wider">
                  {catLabels[cat] ?? cat}
                </h4>
              </div>
              <div className="space-y-2">
                {items.map((p) => (
                  <div key={p.id} className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-navy-800">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm font-bold text-palm-500">{formatCurrency(p.price)}</span>
                        <span className="text-xs text-navy-400">/ {PRICING_UNIT_LABELS[p.unit] ?? p.unit}</span>
                        {p.conditions && (
                          <span className="text-xs text-navy-300 truncate max-w-[160px]">{p.conditions}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditTarget(p); setShowForm(true) }}
                        className="p-2 rounded-xl hover:bg-cream-100 text-navy-400 hover:text-navy-600 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => { if (confirm('Supprimer ce tarif ?')) deleteMutation.mutate(p.id) }}
                        className="p-2 rounded-xl hover:bg-red-50 text-navy-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
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
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery({ queryKey: ['documents'], queryFn: () => documentsApi.list() })
  const [typeFilter,   setTypeFilter]   = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DocumentStatus }) => documentsApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })

  const filtered = data.filter((d) =>
    (typeFilter === 'all' || d.type === typeFilter) &&
    (statusFilter === 'all' || d.status === statusFilter)
  )

  if (isLoading) return <PageLoader />

  return (
    <div>
      {/* Filtres — tous en ligne, wrap sur petit écran */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'quote', 'invoice', 'contract'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                typeFilter === t
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-cream-300 text-navy-600 hover:border-brand-300'
              }`}
            >
              {t === 'all' ? 'Tous' : DOCUMENT_TYPE_LABELS[t as keyof typeof DOCUMENT_TYPE_LABELS]}
            </button>
          ))}
        </div>
        <Select
          options={[
            { value: 'all', label: 'Tous statuts' },
            ...['draft', 'sent', 'accepted', 'paid', 'cancelled'].map((s) => ({
              value: s,
              label: DOCUMENT_STATUS_LABELS[s as DocumentStatus],
            })),
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-36"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Aucun document" description="Les devis et factures apparaîtront ici." />
      ) : (
        /* Cartes — plus de table, 100% mobile-friendly */
        <div className="space-y-2">
          {filtered.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl shadow-card p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-navy-600 bg-cream-100 px-2 py-0.5 rounded-lg">
                      {doc.number || '—'}
                    </span>
                    <Badge className="bg-cream-200 text-navy-600">
                      {DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS]}
                    </Badge>
                  </div>
                  {doc.client_name && (
                    <p className="text-sm font-semibold text-navy-700 mt-1 truncate">{doc.client_name}</p>
                  )}
                </div>
                <button
                  onClick={() => { if (confirm('Supprimer ce document ?')) deleteMutation.mutate(doc.id) }}
                  className="p-2 rounded-xl hover:bg-red-50 text-navy-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-navy-800">{formatCurrency(doc.total)}</span>
                  <span className="text-xs text-navy-400">{formatDate(doc.created_at)}</span>
                </div>
                <select
                  value={doc.status}
                  onChange={(e) => updateStatus.mutate({ id: doc.id, status: e.target.value as DocumentStatus })}
                  className={`text-xs rounded-xl px-2.5 py-1.5 font-semibold border-0 cursor-pointer ${DOCUMENT_STATUS_COLORS[doc.status as DocumentStatus]}`}
                >
                  {(['draft', 'sent', 'accepted', 'paid', 'cancelled'] as DocumentStatus[]).map((s) => (
                    <option key={s} value={s}>{DOCUMENT_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Form Modals ──────────────────────────────────────────────────────────────
function EquipmentFormModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: Equipment | null }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<Equipment>>(
    initial ?? { status: 'available', condition: 'good', category: 'inflatable' }
  )
  const set = (k: keyof Equipment, v: string | number | null) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Partial<Equipment>) => initial ? equipmentApi.update(initial.id, d) : equipmentApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); onClose() },
  })

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Modifier le matériel' : 'Nouveau matériel'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={() => mutate(form)} loading={isPending}>Enregistrer</Button></>}
    >
      <div className="space-y-4">
        <Input label="Nom" required value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Catégorie" required value={form.category ?? 'inflatable'} onChange={(e) => set('category', e.target.value)}
            options={Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <Select label="Statut" value={form.status ?? 'available'} onChange={(e) => set('status', e.target.value)}
            options={Object.entries(EQUIPMENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <Select label="État" value={form.condition ?? 'good'} onChange={(e) => set('condition', e.target.value)}
            options={Object.entries(EQUIPMENT_CONDITION_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <Input label="Prix de location (€)" type="number" step="0.5" value={form.rental_price ?? ''} onChange={(e) => set('rental_price', parseFloat(e.target.value) || null)} />
          <Input label="Caution (€)" type="number" step="0.5" value={form.deposit_amount ?? ''} onChange={(e) => set('deposit_amount', parseFloat(e.target.value) || null)} />
          <Input label="Prix d'achat (€)" type="number" value={form.purchase_price ?? ''} onChange={(e) => set('purchase_price', parseFloat(e.target.value) || null)} />
        </div>
        <Textarea label="Description" value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={2} />
        <Textarea label="Notes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
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
          options={[
            { value: 'babysitting', label: 'Baby-sitting' },
            { value: 'event', label: 'Événement' },
            { value: 'equipment', label: 'Location matériel' },
            { value: 'special', label: 'Tarif spécial' },
          ]} />
        <Input label="Nom du tarif" required value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Tarif nuit, Tarif week-end…" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Prix (€)" required type="number" step="0.5" value={form.price ?? ''} onChange={(e) => set('price', parseFloat(e.target.value) || 0)} />
          <Select label="Par" value={form.unit ?? 'hour'} onChange={(e) => set('unit', e.target.value)}
            options={[
              { value: 'hour', label: 'Heure' },
              { value: 'day', label: 'Journée' },
              { value: 'event', label: 'Événement' },
              { value: 'flat', label: 'Forfait' },
            ]} />
        </div>
        <Textarea label="Conditions" value={form.conditions ?? ''} onChange={(e) => set('conditions', e.target.value)} rows={2} />
      </div>
    </Modal>
  )
}

// ─── Onglets ressources ───────────────────────────────────────────────────────
const RESOURCE_TABS = [
  { id: 'equipment', label: 'Matériel',  icon: <Package  size={14} /> },
  { id: 'pricing',   label: 'Tarifs',    icon: <Tag      size={14} /> },
  { id: 'documents', label: 'Documents', icon: <FileText size={14} /> },
]

// ─── À propos ─────────────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-cream-100">
        <p className="text-sm font-bold text-navy-700 flex items-center gap-2">
          <Info size={15} className="text-brand-500" />
          À propos
        </p>
      </div>
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold leading-tight text-center">TLP</span>
        </div>
        <div>
          <p className="font-bold text-navy-800">TOPLOLIPOP</p>
          <p className="text-xs text-navy-400">Art & Events · Saint-Barthélemy</p>
          <p className="text-xs text-navy-300 mt-0.5">Application de gestion v1.0</p>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function GeneralPage() {
  const [resourceTab, setResourceTab] = useState('equipment')

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header marine */}
      <div
        className="px-5 header-top pb-6"
        style={{ background: 'linear-gradient(145deg, #1A2567 0%, #243580 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
            <Settings size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Paramètres</h1>
            <p className="text-sm text-navy-200 mt-0.5">Profil & ressources métier</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
        {/* ── Profil ── */}
        <ProfileSection />

        {/* ── Notifications ── */}
        <PreferencesSection />

        {/* ── Ressources métier ── */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-cream-100">
            <p className="text-sm font-bold text-navy-700 flex items-center gap-2">
              <Package size={15} className="text-brand-500" />
              Ressources métier
            </p>
          </div>
          <div className="p-4">
            <Tabs tabs={RESOURCE_TABS} active={resourceTab} onChange={setResourceTab} className="mb-4" />
            {resourceTab === 'equipment' && <EquipmentSection />}
            {resourceTab === 'pricing'   && <PricingSection />}
            {resourceTab === 'documents' && <DocumentsSection />}
          </div>
        </div>

        {/* ── À propos ── */}
        <AboutSection />

        {/* Espace bas */}
        <div className="h-2" />
      </div>
    </div>
  )
}
