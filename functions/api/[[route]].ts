import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'
import { createClient } from '@supabase/supabase-js'

interface Env {
  SUPABASE_URL: string
  SUPABASE_KEY: string
}

const app = new Hono<{ Bindings: Env }>()
app.use('*', cors())

const ts = () => new Date().toISOString()
const uid = () => crypto.randomUUID()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = (c: any) => createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── CLIENTS ────────────────────────────────────────────────────────────────

app.get('/api/clients', async (c) => {
  const q = c.req.query('q') ?? ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = sb(c).from('clients').select('*').order('last_name').order('first_name')
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
  const { data } = await query
  return c.json(data ?? [])
})

app.post('/api/clients', async (c) => {
  const b = await c.req.json()
  const id = uid(); const now = ts()
  const { data } = await sb(c).from('clients').insert({
    id, first_name: b.first_name, last_name: b.last_name,
    phone: b.phone ?? null, email: b.email ?? null,
    address: b.address ?? null, event_address: b.event_address ?? null,
    notes: b.notes ?? null, preferences: b.preferences ?? null,
    tags: b.tags ?? [], child_birthdays: b.child_birthdays ?? [],
    partner_id: b.partner_id ?? null, created_at: now, updated_at: now,
  }).select().single()
  return c.json(data, 201)
})

app.get('/api/clients/:id', async (c) => {
  const { data } = await sb(c).from('clients').select('*').eq('id', c.req.param('id')).single()
  if (!data) return c.json({ error: 'Introuvable' }, 404)
  return c.json(data)
})

app.put('/api/clients/:id', async (c) => {
  const b = await c.req.json()
  const { data } = await sb(c).from('clients').update({
    first_name: b.first_name, last_name: b.last_name,
    phone: b.phone ?? null, email: b.email ?? null,
    address: b.address ?? null, event_address: b.event_address ?? null,
    notes: b.notes ?? null, preferences: b.preferences ?? null,
    tags: b.tags ?? [], child_birthdays: b.child_birthdays ?? [],
    partner_id: b.partner_id ?? null, updated_at: ts(),
  }).eq('id', c.req.param('id')).select().single()
  return c.json(data)
})

app.delete('/api/clients/:id', async (c) => {
  await sb(c).from('clients').delete().eq('id', c.req.param('id'))
  return c.json({ ok: true })
})

// ── EVENTS ─────────────────────────────────────────────────────────────────

app.get('/api/events', async (c) => {
  const clientId = c.req.query('client_id')
  const from = c.req.query('from')
  const to = c.req.query('to')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = sb(c).from('events')
    .select('*, clients(first_name, last_name)')
    .order('date', { ascending: false }).order('start_time')
  if (clientId) query = query.eq('client_id', clientId)
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)
  const { data } = await query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return c.json((data ?? []).map((e: any) => ({
    ...e,
    client_name: e.clients ? `${e.clients.first_name} ${e.clients.last_name}` : null,
    clients: undefined,
  })))
})

app.post('/api/events', async (c) => {
  const b = await c.req.json()
  const id = uid(); const now = ts()
  const { data } = await sb(c).from('events').insert({
    id, client_id: b.client_id ?? null, title: b.title,
    type: b.type ?? 'other', date: b.date,
    start_time: b.start_time ?? null, end_time: b.end_time ?? null,
    location: b.location ?? null, theme: b.theme ?? null,
    child_count: b.child_count ?? 0,
    instructions: b.instructions ?? null, notes: b.notes ?? null,
    status: b.status ?? 'pending', checklist: b.checklist ?? [],
    color: b.color ?? null, created_at: now, updated_at: now,
  }).select().single()
  return c.json(data, 201)
})

app.get('/api/events/:id', async (c) => {
  const id = c.req.param('id')
  const [evRes, assignRes, rentalRes] = await Promise.all([
    sb(c).from('events').select('*, clients(first_name, last_name)').eq('id', id).single(),
    sb(c).from('assignments').select('*, collaborators(first_name, last_name, role)').eq('event_id', id),
    sb(c).from('equipment_rentals').select('*, equipment(name, category)').eq('event_id', id),
  ])
  if (!evRes.data) return c.json({ error: 'Introuvable' }, 404)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cl = evRes.data.clients as any
  return c.json({
    ...evRes.data,
    client_name: cl ? `${cl.first_name} ${cl.last_name}` : null,
    clients: undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assignments: (assignRes.data ?? []).map((a: any) => ({
      ...a,
      collab_name: `${a.collaborators.first_name} ${a.collaborators.last_name}`,
      role: a.collaborators.role,
      collaborators: undefined,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rentals: (rentalRes.data ?? []).map((r: any) => ({
      ...r,
      eq_name: r.equipment.name,
      category: r.equipment.category,
      equipment: undefined,
    })),
  })
})

app.put('/api/events/:id', async (c) => {
  const b = await c.req.json()
  const { data } = await sb(c).from('events').update({
    client_id: b.client_id ?? null, title: b.title,
    type: b.type ?? 'other', date: b.date,
    start_time: b.start_time ?? null, end_time: b.end_time ?? null,
    location: b.location ?? null, theme: b.theme ?? null,
    child_count: b.child_count ?? 0,
    instructions: b.instructions ?? null, notes: b.notes ?? null,
    status: b.status ?? 'pending', checklist: b.checklist ?? [],
    color: b.color ?? null, updated_at: ts(),
  }).eq('id', c.req.param('id')).select().single()
  return c.json(data)
})

app.delete('/api/events/:id', async (c) => {
  await sb(c).from('events').delete().eq('id', c.req.param('id'))
  return c.json({ ok: true })
})

// ── EQUIPMENT ──────────────────────────────────────────────────────────────

app.get('/api/equipment', async (c) => {
  const { data } = await sb(c).from('equipment').select('*').order('category').order('name')
  return c.json(data ?? [])
})

app.post('/api/equipment', async (c) => {
  const b = await c.req.json()
  const id = uid(); const now = ts()
  const { data } = await sb(c).from('equipment').insert({
    id, name: b.name, category: b.category,
    description: b.description ?? null, status: b.status ?? 'available',
    condition: b.condition ?? 'good', photos: b.photos ?? [],
    purchase_date: b.purchase_date ?? null, purchase_price: b.purchase_price ?? null,
    rental_price: b.rental_price ?? null, deposit_amount: b.deposit_amount ?? null,
    notes: b.notes ?? null, created_at: now, updated_at: now,
  }).select().single()
  return c.json(data, 201)
})

app.put('/api/equipment/:id', async (c) => {
  const b = await c.req.json()
  const { data } = await sb(c).from('equipment').update({
    name: b.name, category: b.category,
    description: b.description ?? null, status: b.status ?? 'available',
    condition: b.condition ?? 'good', photos: b.photos ?? [],
    purchase_date: b.purchase_date ?? null, purchase_price: b.purchase_price ?? null,
    rental_price: b.rental_price ?? null, deposit_amount: b.deposit_amount ?? null,
    notes: b.notes ?? null, updated_at: ts(),
  }).eq('id', c.req.param('id')).select().single()
  return c.json(data)
})

app.delete('/api/equipment/:id', async (c) => {
  await sb(c).from('equipment').delete().eq('id', c.req.param('id'))
  return c.json({ ok: true })
})

// ── COLLABORATORS ──────────────────────────────────────────────────────────

app.get('/api/collaborators', async (c) => {
  const role = c.req.query('role')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = sb(c).from('collaborators').select('*').order('last_name').order('first_name')
  if (role) query = query.eq('role', role)
  const { data } = await query
  return c.json(data ?? [])
})

app.post('/api/collaborators', async (c) => {
  const b = await c.req.json()
  const id = uid(); const now = ts()
  const { data } = await sb(c).from('collaborators').insert({
    id, first_name: b.first_name, last_name: b.last_name,
    phone: b.phone ?? null, email: b.email ?? null,
    address: b.address ?? null, photo: b.photo ?? null,
    role: b.role ?? 'other', status: b.status ?? 'active',
    skills: b.skills ?? [], languages: b.languages ?? [],
    experience: b.experience ?? null, hourly_rate: b.hourly_rate ?? null,
    notes: b.notes ?? null, documents: b.documents ?? [],
    created_at: now, updated_at: now,
  }).select().single()
  return c.json(data, 201)
})

app.get('/api/collaborators/:id', async (c) => {
  const id = c.req.param('id')
  const [colRes, assignRes] = await Promise.all([
    sb(c).from('collaborators').select('*').eq('id', id).single(),
    sb(c).from('assignments').select('*, events(title, date, type)').eq('collaborator_id', id),
  ])
  if (!colRes.data) return c.json({ error: 'Introuvable' }, 404)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignments = (assignRes.data ?? []).map((a: any) => ({
    ...a, title: a.events?.title, date: a.events?.date, type: a.events?.type, events: undefined,
  })).sort((a: any, b: any) => (b.date ?? '').localeCompare(a.date ?? ''))
  return c.json({ ...colRes.data, assignments })
})

app.put('/api/collaborators/:id', async (c) => {
  const b = await c.req.json()
  const { data } = await sb(c).from('collaborators').update({
    first_name: b.first_name, last_name: b.last_name,
    phone: b.phone ?? null, email: b.email ?? null,
    address: b.address ?? null, photo: b.photo ?? null,
    role: b.role ?? 'other', status: b.status ?? 'active',
    skills: b.skills ?? [], languages: b.languages ?? [],
    experience: b.experience ?? null, hourly_rate: b.hourly_rate ?? null,
    notes: b.notes ?? null, documents: b.documents ?? [],
    updated_at: ts(),
  }).eq('id', c.req.param('id')).select().single()
  return c.json(data)
})

app.delete('/api/collaborators/:id', async (c) => {
  await sb(c).from('collaborators').delete().eq('id', c.req.param('id'))
  return c.json({ ok: true })
})

// ── ASSIGNMENTS ────────────────────────────────────────────────────────────

app.get('/api/assignments', async (c) => {
  const eventId = c.req.query('event_id')
  const collabId = c.req.query('collaborator_id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = sb(c).from('assignments')
    .select('*, collaborators(first_name, last_name, role), events(title, date, type)')
    .order('created_at', { ascending: false })
  if (eventId) query = query.eq('event_id', eventId)
  if (collabId) query = query.eq('collaborator_id', collabId)
  const { data } = await query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return c.json((data ?? []).map((a: any) => ({
    ...a,
    collab_name: a.collaborators ? `${a.collaborators.first_name} ${a.collaborators.last_name}` : null,
    role: a.collaborators?.role,
    event_title: a.events?.title,
    event_date: a.events?.date,
    event_type: a.events?.type,
    collaborators: undefined,
    events: undefined,
  })))
})

app.post('/api/assignments', async (c) => {
  const b = await c.req.json()
  const id = uid(); const now = ts()
  const { data } = await sb(c).from('assignments').insert({
    id, event_id: b.event_id, collaborator_id: b.collaborator_id,
    start_time: b.start_time ?? null, end_time: b.end_time ?? null,
    rate: b.rate ?? null, status: b.status ?? 'assigned',
    notes: b.notes ?? null, created_at: now, updated_at: now,
  }).select().single()
  return c.json({ id: data?.id }, 201)
})

app.delete('/api/assignments/:id', async (c) => {
  await sb(c).from('assignments').delete().eq('id', c.req.param('id'))
  return c.json({ ok: true })
})

// ── DOCUMENTS ──────────────────────────────────────────────────────────────

app.get('/api/documents', async (c) => {
  const clientId = c.req.query('client_id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = sb(c).from('documents')
    .select('*, clients(first_name, last_name)')
    .order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data } = await query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return c.json((data ?? []).map((d: any) => ({
    ...d,
    client_name: d.clients ? `${d.clients.first_name} ${d.clients.last_name}` : null,
    clients: undefined,
  })))
})

app.post('/api/documents', async (c) => {
  const b = await c.req.json()
  const id = uid(); const now = ts()
  const { count } = await sb(c).from('documents').select('*', { count: 'exact', head: true }).eq('type', b.type)
  const n = (count ?? 0) + 1
  const prefix = b.type === 'quote' ? 'DEV' : b.type === 'invoice' ? 'FAC' : 'CTR'
  const number = `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`
  const { data } = await sb(c).from('documents').insert({
    id, client_id: b.client_id ?? null, event_id: b.event_id ?? null,
    type: b.type, number, status: b.status ?? 'draft',
    title: b.title ?? null, items: b.items ?? [],
    subtotal: b.subtotal ?? 0, tax_rate: b.tax_rate ?? 0,
    tax_amount: b.tax_amount ?? 0, total: b.total ?? 0,
    notes: b.notes ?? null, valid_until: b.valid_until ?? null,
    due_date: b.due_date ?? null, created_at: now, updated_at: now,
  }).select().single()
  return c.json(data, 201)
})

app.put('/api/documents/:id', async (c) => {
  const b = await c.req.json()
  const { data } = await sb(c).from('documents').update({
    status: b.status ?? 'draft', title: b.title ?? null,
    items: b.items ?? [], subtotal: b.subtotal ?? 0,
    tax_rate: b.tax_rate ?? 0, tax_amount: b.tax_amount ?? 0,
    total: b.total ?? 0, notes: b.notes ?? null,
    valid_until: b.valid_until ?? null, due_date: b.due_date ?? null,
    paid_at: b.paid_at ?? null, updated_at: ts(),
  }).eq('id', c.req.param('id')).select().single()
  return c.json(data)
})

app.delete('/api/documents/:id', async (c) => {
  await sb(c).from('documents').delete().eq('id', c.req.param('id'))
  return c.json({ ok: true })
})

// ── PRICING ────────────────────────────────────────────────────────────────

app.get('/api/pricing', async (c) => {
  const { data } = await sb(c).from('pricing').select('*').order('category').order('name')
  return c.json(data ?? [])
})

app.post('/api/pricing', async (c) => {
  const b = await c.req.json()
  const id = uid(); const now = ts()
  const { data } = await sb(c).from('pricing').insert({
    id, category: b.category, name: b.name,
    description: b.description ?? null, price: b.price,
    unit: b.unit ?? 'hour', conditions: b.conditions ?? null,
    active: b.active ?? true, created_at: now, updated_at: now,
  }).select().single()
  return c.json(data, 201)
})

app.put('/api/pricing/:id', async (c) => {
  const b = await c.req.json()
  const { data } = await sb(c).from('pricing').update({
    category: b.category, name: b.name,
    description: b.description ?? null, price: b.price,
    unit: b.unit ?? 'hour', conditions: b.conditions ?? null,
    active: b.active ?? true, updated_at: ts(),
  }).eq('id', c.req.param('id')).select().single()
  return c.json(data)
})

app.delete('/api/pricing/:id', async (c) => {
  await sb(c).from('pricing').delete().eq('id', c.req.param('id'))
  return c.json({ ok: true })
})

// ── PARTNERS ───────────────────────────────────────────────────────────────

app.get('/api/partners', async (c) => {
  const { data } = await sb(c).from('partners').select('*').order('name')
  return c.json(data ?? [])
})

app.post('/api/partners', async (c) => {
  const b = await c.req.json()
  const id = uid(); const now = ts()
  const { data } = await sb(c).from('partners').insert({
    id, name: b.name, contact_name: b.contact_name ?? null,
    email: b.email ?? null, phone: b.phone ?? null,
    commission_rate: b.commission_rate ?? 0,
    notes: b.notes ?? null, active: true,
    created_at: now, updated_at: now,
  }).select().single()
  return c.json(data, 201)
})

// ── STATS ──────────────────────────────────────────────────────────────────

app.get('/api/stats', async (c) => {
  const today = new Date().toISOString().split('T')[0]
  const [clientsRes, eventsRes, equipRes, collabRes, docsRes, upcomingRes] = await Promise.all([
    sb(c).from('clients').select('*', { count: 'exact', head: true }),
    sb(c).from('events').select('*', { count: 'exact', head: true }).neq('status', 'cancelled'),
    sb(c).from('equipment').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    sb(c).from('collaborators').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    sb(c).from('documents').select('total').eq('status', 'paid'),
    sb(c).from('events').select('*, clients(first_name, last_name)')
      .gte('date', today).neq('status', 'cancelled').order('date').limit(5),
  ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalRevenue = (docsRes.data ?? []).reduce((sum: number, d: any) => sum + (d.total ?? 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upcomingEvents = (upcomingRes.data ?? []).map((e: any) => ({
    ...e,
    client_name: e.clients ? `${e.clients.first_name} ${e.clients.last_name}` : null,
    clients: undefined,
  }))
  return c.json({
    clients: clientsRes.count ?? 0,
    events: eventsRes.count ?? 0,
    availableEquipment: equipRes.count ?? 0,
    activeCollaborators: collabRes.count ?? 0,
    totalRevenue,
    upcomingEvents,
  })
})

export const onRequest = handle(app)
