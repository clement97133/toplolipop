import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

interface Env {
  SUPABASE_URL: string
  SUPABASE_KEY: string
}

const app = new Hono<{ Bindings: Env }>()
app.use('*', cors())

const ts = () => new Date().toISOString()
const uid = () => crypto.randomUUID()

function hdrs(env: Env, extra?: Record<string, string>) {
  return { 'apikey': env.SUPABASE_KEY, 'Authorization': `Bearer ${env.SUPABASE_KEY}`, 'Content-Type': 'application/json', ...extra }
}

const rest = (env: Env) => `${env.SUPABASE_URL}/rest/v1`

async function sbGet(env: Env, path: string): Promise<unknown[]> {
  const r = await fetch(rest(env) + path, { headers: hdrs(env) })
  return r.json()
}

async function sbPost(env: Env, table: string, data: object): Promise<unknown> {
  const r = await fetch(`${rest(env)}/${table}`, {
    method: 'POST', body: JSON.stringify(data),
    headers: hdrs(env, { 'Prefer': 'return=representation' }),
  })
  const rows = await r.json() as unknown[]
  return rows[0]
}

async function sbPatch(env: Env, table: string, id: string, data: object): Promise<unknown> {
  const r = await fetch(`${rest(env)}/${table}?id=eq.${id}`, {
    method: 'PATCH', body: JSON.stringify(data),
    headers: hdrs(env, { 'Prefer': 'return=representation' }),
  })
  const rows = await r.json() as unknown[]
  return rows[0]
}

async function sbDel(env: Env, table: string, id: string): Promise<void> {
  await fetch(`${rest(env)}/${table}?id=eq.${id}`, { method: 'DELETE', headers: hdrs(env) })
}

async function sbCount(env: Env, path: string): Promise<number> {
  const r = await fetch(rest(env) + path, { method: 'HEAD', headers: hdrs(env, { 'Prefer': 'count=exact' }) })
  const range = r.headers.get('Content-Range') ?? '*/0'
  return parseInt(range.split('/')[1] ?? '0', 10)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flatClients(rows: unknown[]): unknown[] {
  return (rows as any[]).map(e => ({ ...e, client_name: e.clients ? `${e.clients.first_name} ${e.clients.last_name}` : null, clients: undefined }))
}

// ── CLIENTS ────────────────────────────────────────────────────────────────

app.get('/api/clients', async (c) => {
  const q = c.req.query('q') ?? ''
  let path = '/clients?select=*&order=last_name,first_name'
  if (q) { const w = encodeURIComponent(`%${q}%`); path += `&or=(first_name.ilike.${w},last_name.ilike.${w})` }
  return c.json(await sbGet(c.env, path))
})

app.post('/api/clients', async (c) => {
  const b = await c.req.json(); const id = uid(); const now = ts()
  return c.json(await sbPost(c.env, 'clients', {
    id, first_name: b.first_name, last_name: b.last_name, phone: b.phone ?? null, email: b.email ?? null,
    address: b.address ?? null, event_address: b.event_address ?? null, notes: b.notes ?? null,
    preferences: b.preferences ?? null, tags: b.tags ?? [], child_birthdays: b.child_birthdays ?? [],
    partner_id: b.partner_id ?? null, created_at: now, updated_at: now,
  }), 201)
})

app.get('/api/clients/:id', async (c) => {
  const rows = await sbGet(c.env, `/clients?select=*&id=eq.${c.req.param('id')}`)
  if (!rows[0]) return c.json({ error: 'Introuvable' }, 404)
  return c.json(rows[0])
})

app.put('/api/clients/:id', async (c) => {
  const b = await c.req.json()
  return c.json(await sbPatch(c.env, 'clients', c.req.param('id'), {
    first_name: b.first_name, last_name: b.last_name, phone: b.phone ?? null, email: b.email ?? null,
    address: b.address ?? null, event_address: b.event_address ?? null, notes: b.notes ?? null,
    preferences: b.preferences ?? null, tags: b.tags ?? [], child_birthdays: b.child_birthdays ?? [],
    partner_id: b.partner_id ?? null, updated_at: ts(),
  }))
})

app.delete('/api/clients/:id', async (c) => {
  await sbDel(c.env, 'clients', c.req.param('id'))
  return c.json({ ok: true })
})

// ── EVENTS ─────────────────────────────────────────────────────────────────

app.get('/api/events', async (c) => {
  const clientId = c.req.query('client_id')
  const from = c.req.query('from')
  const to = c.req.query('to')
  let path = '/events?select=*,clients(first_name,last_name)&order=date.desc,start_time'
  if (clientId) path += `&client_id=eq.${clientId}`
  if (from) path += `&date=gte.${from}`
  if (to) path += `&date=lte.${to}`
  return c.json(flatClients(await sbGet(c.env, path)))
})

app.post('/api/events', async (c) => {
  const b = await c.req.json(); const id = uid(); const now = ts()
  return c.json(await sbPost(c.env, 'events', {
    id, client_id: b.client_id ?? null, title: b.title, type: b.type ?? 'other', date: b.date,
    start_time: b.start_time ?? null, end_time: b.end_time ?? null, location: b.location ?? null,
    theme: b.theme ?? null, child_count: b.child_count ?? 0, instructions: b.instructions ?? null,
    notes: b.notes ?? null, status: b.status ?? 'pending', checklist: b.checklist ?? [],
    color: b.color ?? null, created_at: now, updated_at: now,
  }), 201)
})

app.get('/api/events/:id', async (c) => {
  const id = c.req.param('id')
  const [evRows, assigns, rentals] = await Promise.all([
    sbGet(c.env, `/events?select=*,clients(first_name,last_name)&id=eq.${id}`),
    sbGet(c.env, `/assignments?select=*,collaborators(first_name,last_name,role)&event_id=eq.${id}`),
    sbGet(c.env, `/equipment_rentals?select=*,equipment(name,category)&event_id=eq.${id}`),
  ])
  if (!evRows[0]) return c.json({ error: 'Introuvable' }, 404)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ev = evRows[0] as any
  return c.json({
    ...ev,
    client_name: ev.clients ? `${ev.clients.first_name} ${ev.clients.last_name}` : null,
    clients: undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assignments: (assigns as any[]).map(a => ({ ...a, collab_name: `${a.collaborators.first_name} ${a.collaborators.last_name}`, role: a.collaborators.role, collaborators: undefined })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rentals: (rentals as any[]).map(r => ({ ...r, eq_name: r.equipment.name, category: r.equipment.category, equipment: undefined })),
  })
})

app.put('/api/events/:id', async (c) => {
  const b = await c.req.json()
  return c.json(await sbPatch(c.env, 'events', c.req.param('id'), {
    client_id: b.client_id ?? null, title: b.title, type: b.type ?? 'other', date: b.date,
    start_time: b.start_time ?? null, end_time: b.end_time ?? null, location: b.location ?? null,
    theme: b.theme ?? null, child_count: b.child_count ?? 0, instructions: b.instructions ?? null,
    notes: b.notes ?? null, status: b.status ?? 'pending', checklist: b.checklist ?? [],
    color: b.color ?? null, updated_at: ts(),
  }))
})

app.delete('/api/events/:id', async (c) => {
  await sbDel(c.env, 'events', c.req.param('id'))
  return c.json({ ok: true })
})

// ── EQUIPMENT ──────────────────────────────────────────────────────────────

app.get('/api/equipment', async (c) => c.json(await sbGet(c.env, '/equipment?select=*&order=category,name')))

app.post('/api/equipment', async (c) => {
  const b = await c.req.json(); const id = uid(); const now = ts()
  return c.json(await sbPost(c.env, 'equipment', {
    id, name: b.name, category: b.category, description: b.description ?? null,
    status: b.status ?? 'available', condition: b.condition ?? 'good', photos: b.photos ?? [],
    purchase_date: b.purchase_date ?? null, purchase_price: b.purchase_price ?? null,
    rental_price: b.rental_price ?? null, deposit_amount: b.deposit_amount ?? null,
    notes: b.notes ?? null, created_at: now, updated_at: now,
  }), 201)
})

app.put('/api/equipment/:id', async (c) => {
  const b = await c.req.json()
  return c.json(await sbPatch(c.env, 'equipment', c.req.param('id'), {
    name: b.name, category: b.category, description: b.description ?? null,
    status: b.status ?? 'available', condition: b.condition ?? 'good', photos: b.photos ?? [],
    purchase_date: b.purchase_date ?? null, purchase_price: b.purchase_price ?? null,
    rental_price: b.rental_price ?? null, deposit_amount: b.deposit_amount ?? null,
    notes: b.notes ?? null, updated_at: ts(),
  }))
})

app.delete('/api/equipment/:id', async (c) => {
  await sbDel(c.env, 'equipment', c.req.param('id'))
  return c.json({ ok: true })
})

// ── COLLABORATORS ──────────────────────────────────────────────────────────

app.get('/api/collaborators', async (c) => {
  const role = c.req.query('role')
  let path = '/collaborators?select=*&order=last_name,first_name'
  if (role) path += `&role=eq.${role}`
  return c.json(await sbGet(c.env, path))
})

app.post('/api/collaborators', async (c) => {
  const b = await c.req.json(); const id = uid(); const now = ts()
  return c.json(await sbPost(c.env, 'collaborators', {
    id, first_name: b.first_name, last_name: b.last_name, phone: b.phone ?? null, email: b.email ?? null,
    address: b.address ?? null, photo: b.photo ?? null, role: b.role ?? 'other', status: b.status ?? 'active',
    skills: b.skills ?? [], languages: b.languages ?? [], experience: b.experience ?? null,
    hourly_rate: b.hourly_rate ?? null, notes: b.notes ?? null, documents: b.documents ?? [],
    created_at: now, updated_at: now,
  }), 201)
})

app.get('/api/collaborators/:id', async (c) => {
  const id = c.req.param('id')
  const [colRows, assigns] = await Promise.all([
    sbGet(c.env, `/collaborators?select=*&id=eq.${id}`),
    sbGet(c.env, `/assignments?select=*,events(title,date,type)&collaborator_id=eq.${id}`),
  ])
  if (!colRows[0]) return c.json({ error: 'Introuvable' }, 404)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignments = (assigns as any[]).map(a => ({ ...a, title: a.events?.title, date: a.events?.date, type: a.events?.type, events: undefined }))
    .sort((a: any, b: any) => (b.date ?? '').localeCompare(a.date ?? ''))
  return c.json({ ...colRows[0], assignments })
})

app.put('/api/collaborators/:id', async (c) => {
  const b = await c.req.json()
  return c.json(await sbPatch(c.env, 'collaborators', c.req.param('id'), {
    first_name: b.first_name, last_name: b.last_name, phone: b.phone ?? null, email: b.email ?? null,
    address: b.address ?? null, photo: b.photo ?? null, role: b.role ?? 'other', status: b.status ?? 'active',
    skills: b.skills ?? [], languages: b.languages ?? [], experience: b.experience ?? null,
    hourly_rate: b.hourly_rate ?? null, notes: b.notes ?? null, documents: b.documents ?? [], updated_at: ts(),
  }))
})

app.delete('/api/collaborators/:id', async (c) => {
  await sbDel(c.env, 'collaborators', c.req.param('id'))
  return c.json({ ok: true })
})

// ── ASSIGNMENTS ────────────────────────────────────────────────────────────

app.get('/api/assignments', async (c) => {
  const eventId = c.req.query('event_id')
  const collabId = c.req.query('collaborator_id')
  let path = '/assignments?select=*,collaborators(first_name,last_name,role),events(title,date,type)&order=created_at.desc'
  if (eventId) path += `&event_id=eq.${eventId}`
  if (collabId) path += `&collaborator_id=eq.${collabId}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return c.json((await sbGet(c.env, path) as any[]).map(a => ({
    ...a, collab_name: a.collaborators ? `${a.collaborators.first_name} ${a.collaborators.last_name}` : null,
    role: a.collaborators?.role, event_title: a.events?.title, event_date: a.events?.date, event_type: a.events?.type,
    collaborators: undefined, events: undefined,
  })))
})

app.post('/api/assignments', async (c) => {
  const b = await c.req.json(); const id = uid(); const now = ts()
  const data = await sbPost(c.env, 'assignments', {
    id, event_id: b.event_id, collaborator_id: b.collaborator_id,
    start_time: b.start_time ?? null, end_time: b.end_time ?? null,
    rate: b.rate ?? null, status: b.status ?? 'assigned', notes: b.notes ?? null, created_at: now, updated_at: now,
  }) as { id: string }
  return c.json({ id: data.id }, 201)
})

app.delete('/api/assignments/:id', async (c) => {
  await sbDel(c.env, 'assignments', c.req.param('id'))
  return c.json({ ok: true })
})

// ── DOCUMENTS ──────────────────────────────────────────────────────────────

app.get('/api/documents', async (c) => {
  const clientId = c.req.query('client_id')
  let path = '/documents?select=*,clients(first_name,last_name)&order=created_at.desc'
  if (clientId) path += `&client_id=eq.${clientId}`
  return c.json(flatClients(await sbGet(c.env, path)))
})

app.post('/api/documents', async (c) => {
  const b = await c.req.json(); const id = uid(); const now = ts()
  const count = await sbCount(c.env, `/documents?type=eq.${b.type}`)
  const prefix = b.type === 'quote' ? 'DEV' : b.type === 'invoice' ? 'FAC' : 'CTR'
  const number = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`
  return c.json(await sbPost(c.env, 'documents', {
    id, client_id: b.client_id ?? null, event_id: b.event_id ?? null, type: b.type, number,
    status: b.status ?? 'draft', title: b.title ?? null, items: b.items ?? [],
    subtotal: b.subtotal ?? 0, tax_rate: b.tax_rate ?? 0, tax_amount: b.tax_amount ?? 0,
    total: b.total ?? 0, notes: b.notes ?? null, valid_until: b.valid_until ?? null,
    due_date: b.due_date ?? null, created_at: now, updated_at: now,
  }), 201)
})

app.put('/api/documents/:id', async (c) => {
  const b = await c.req.json()
  return c.json(await sbPatch(c.env, 'documents', c.req.param('id'), {
    status: b.status ?? 'draft', title: b.title ?? null, items: b.items ?? [],
    subtotal: b.subtotal ?? 0, tax_rate: b.tax_rate ?? 0, tax_amount: b.tax_amount ?? 0,
    total: b.total ?? 0, notes: b.notes ?? null, valid_until: b.valid_until ?? null,
    due_date: b.due_date ?? null, paid_at: b.paid_at ?? null, updated_at: ts(),
  }))
})

app.delete('/api/documents/:id', async (c) => {
  await sbDel(c.env, 'documents', c.req.param('id'))
  return c.json({ ok: true })
})

// ── PRICING ────────────────────────────────────────────────────────────────

app.get('/api/pricing', async (c) => c.json(await sbGet(c.env, '/pricing?select=*&order=category,name')))

app.post('/api/pricing', async (c) => {
  const b = await c.req.json(); const id = uid(); const now = ts()
  return c.json(await sbPost(c.env, 'pricing', {
    id, category: b.category, name: b.name, description: b.description ?? null, price: b.price,
    unit: b.unit ?? 'hour', conditions: b.conditions ?? null, active: b.active ?? true, created_at: now, updated_at: now,
  }), 201)
})

app.put('/api/pricing/:id', async (c) => {
  const b = await c.req.json()
  return c.json(await sbPatch(c.env, 'pricing', c.req.param('id'), {
    category: b.category, name: b.name, description: b.description ?? null, price: b.price,
    unit: b.unit ?? 'hour', conditions: b.conditions ?? null, active: b.active ?? true, updated_at: ts(),
  }))
})

app.delete('/api/pricing/:id', async (c) => {
  await sbDel(c.env, 'pricing', c.req.param('id'))
  return c.json({ ok: true })
})

// ── PARTNERS ───────────────────────────────────────────────────────────────

app.get('/api/partners', async (c) => c.json(await sbGet(c.env, '/partners?select=*&order=name')))

app.post('/api/partners', async (c) => {
  const b = await c.req.json(); const id = uid(); const now = ts()
  return c.json(await sbPost(c.env, 'partners', {
    id, name: b.name, contact_name: b.contact_name ?? null, email: b.email ?? null,
    phone: b.phone ?? null, commission_rate: b.commission_rate ?? 0,
    notes: b.notes ?? null, active: true, created_at: now, updated_at: now,
  }), 201)
})

// ── STATS ──────────────────────────────────────────────────────────────────

app.get('/api/stats', async (c) => {
  const today = new Date().toISOString().split('T')[0]
  const [cCnt, eCnt, eqCnt, coCnt, paidDocs, upcoming] = await Promise.all([
    sbCount(c.env, '/clients'),
    sbCount(c.env, '/events?status=neq.cancelled'),
    sbCount(c.env, '/equipment?status=eq.available'),
    sbCount(c.env, '/collaborators?status=eq.active'),
    sbGet(c.env, '/documents?select=total&status=eq.paid'),
    sbGet(c.env, `/events?select=*,clients(first_name,last_name)&date=gte.${today}&status=neq.cancelled&order=date&limit=5`),
  ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalRevenue = (paidDocs as any[]).reduce((sum, d) => sum + (d.total ?? 0), 0)
  return c.json({ clients: cCnt, events: eCnt, availableEquipment: eqCnt, activeCollaborators: coCnt, totalRevenue, upcomingEvents: flatClients(upcoming) })
})

export const onRequest = handle(app)
