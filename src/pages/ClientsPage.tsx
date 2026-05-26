import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Phone, Mail, MapPin, ChevronRight, Trash2, Tag } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { SearchInput } from '../components/ui/SearchInput'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { clientsApi } from '../lib/api'
import { parseJson } from '../lib/utils'
import type { Client } from '../types'

function ClientCard({ client, onDelete }: { client: Client; onDelete: (id: string) => void }) {
  const navigate = useNavigate()
  const tags = parseJson<string>(client.tags)

  return (
    <div
      className="bg-white rounded-3xl border border-cream-300/60 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
      onClick={() => navigate(`/clients/${client.id}`)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar firstName={client.first_name} lastName={client.last_name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-bold text-navy-800 truncate">{client.first_name} {client.last_name}</p>
              <ChevronRight size={16} className="text-navy-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
            </div>
            <div className="space-y-1 mt-1.5">
              {client.phone && (
                <div className="flex items-center gap-1.5 text-xs text-navy-500">
                  <Phone size={11} className="flex-shrink-0 text-brand-400" />
                  {client.phone}
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-1.5 text-xs text-navy-400 truncate">
                  <Mail size={11} className="flex-shrink-0 text-navy-300" />
                  {client.email}
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-1.5 text-xs text-navy-400 truncate">
                  <MapPin size={11} className="flex-shrink-0 text-navy-300" />
                  {client.address}
                </div>
              )}
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} className="bg-brand-50 text-brand-600 text-[10px] px-2 py-0.5">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && <span className="text-[10px] text-navy-400">+{tags.length - 3}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 py-2.5 border-t border-cream-200 flex justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm('Supprimer ce client ?')) onDelete(client.id) }}
          className="p-1.5 rounded-xl hover:bg-red-50 text-navy-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function ClientFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [form, setForm] = useState<Partial<Client>>({ tags: [], child_birthdays: [] })
  const [tagsInput, setTagsInput] = useState('')

  const set = (k: keyof Client, v: string | null) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Partial<Client>) => clientsApi.create(d),
    onSuccess: (client) => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      onClose()
      navigate(`/clients/${client.id}`)
    },
  })

  const submit = () => {
    const tags = tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : []
    mutate({ ...form, tags })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouveau client" size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={isPending}>Créer le client</Button></>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Prénom" required value={form.first_name ?? ''} onChange={(e) => set('first_name', e.target.value)} />
          <Input label="Nom" required value={form.last_name ?? ''} onChange={(e) => set('last_name', e.target.value)} />
          <Input label="Téléphone" type="tel" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
          <Input label="Email" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
        </div>
        <Input label="Adresse" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
        <Input label="Adresse de l'événement" value={form.event_address ?? ''} onChange={(e) => set('event_address', e.target.value)} />
        <Input label="Tags (séparés par virgule)" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Ex: VIP, Fidèle, Particulier…" />
        <Textarea label="Notes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Informations importantes, préférences…" />
      </div>
    </Modal>
  )
}

export default function ClientsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data = [], isLoading } = useQuery({ queryKey: ['clients', search], queryFn: () => clientsApi.list(search) })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); qc.invalidateQueries({ queryKey: ['stats'] }) },
  })

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header marine */}
      <div
        className="px-5 pt-12 pb-6"
        style={{ background: 'linear-gradient(145deg, #1A2567 0%, #243580 100%)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Réservations</h1>
            <p className="text-sm text-navy-200 mt-0.5">{data.length} client{data.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm"><Plus size={15} />Nouveau</Button>
        </div>
      </div>

      <div className="px-4 py-5 max-w-7xl mx-auto">
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un client…" className="max-w-sm" />
        </div>

        {isLoading ? (
          <PageLoader />
        ) : data.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'Aucun client trouvé' : 'Aucun client'}
            description={search ? `Aucun résultat pour "${search}"` : 'Créez votre premier dossier client.'}
            action={!search ? <Button onClick={() => setShowForm(true)}><Plus size={15} />Nouveau client</Button> : undefined}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((client) => (
              <ClientCard key={client.id} client={client} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>
        )}

        <ClientFormModal open={showForm} onClose={() => setShowForm(false)} />
      </div>
    </div>
  )
}
