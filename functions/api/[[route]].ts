import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

interface Env {
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const ts = () => new Date().toISOString()
const uid = () => crypto.randomUUID()

// ── CLIENTS ────────────────────────────────────────────────────────────────

app.get('/api/clients', async (c) => {
  const q = c.req.query('q') ?? ''
  const { results } = q
    ? await c.env.DB.prepare(
        `SELECT * FROM clients WHERE lower(first_name || ' ' || last_name) LIKE ? ORDER BY last_name, first_name`
      ).bind(`%${q.toLowerCase()}%`).all()
    : await c.env.DB.prepare(`SELECT * FROM clients ORDER BY last_name, first_name`).all()
  return c.json(results)
})

app.post('/api/clients', async (c) => {
  const b = await c.req.json()
  const id = uid()
  const now = ts()
  await c.env.DB.prepare(
    `INSERT INTO clients (id,first_name,last_name,phone,email,address,event_address,notes,preferences,tags,child_birthdays,partner_id,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, b.first_name, b.last_name, b.phone ?? null, b.email ?? null, b.address ?? null,
    b.event_address ?? null, b.notes ?? null, b.preferences ?? null,
    JSON.stringify(b.tags ?? []), JSON.stringify(b.child_birthdays ?? []),
    b.partner_id ?? null, now, now).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM clients WHERE id=?').bind(id).first(), 201)
})

app.get('/api/clients/:id', async (c) => {
  const client = await c.env.DB.prepare('SELECT * FROM clients WHERE id=?').bind(c.req.param('id')).first()
  if (!client) return c.json({ error: 'Introuvable' }, 404)
  return c.json(client)
})

app.put('/api/clients/:id', async (c) => {
  const b = await c.req.json()
  const now = ts()
  await c.env.DB.prepare(
    `UPDATE clients SET first_name=?,last_name=?,phone=?,email=?,address=?,event_address=?,notes=?,preferences=?,tags=?,child_birthdays=?,partner_id=?,updated_at=? WHERE id=?`
  ).bind(b.first_name, b.last_name, b.phone ?? null, b.email ?? null, b.address ?? null,
    b.event_address ?? null, b.notes ?? null, b.preferences ?? null,
    JSON.stringify(b.tags ?? []), JSON.stringify(b.child_birthdays ?? []),
    b.partner_id ?? null, now, c.req.param('id')).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM clients WHERE id=?').bind(c.req.param('id')).first())
})

app.delete('/api/clients/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM clients WHERE id=?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

// ── EVENTS ─────────────────────────────────────────────────────────────────

app.get('/api/events', async (c) => {
  const clientId = c.req.query('client_id')
  const from = c.req.query('from')
  const to = c.req.query('to')
  let sql = `SELECT e.*, c.first_name||' '||c.last_name as client_name
             FROM events e LEFT JOIN clients c ON e.client_id=c.id WHERE 1=1`
  const params: (string | null)[] = []
  if (clientId) { sql += ' AND e.client_id=?'; params.push(clientId) }
  if (from) { sql += ' AND e.date>=?'; params.push(from) }
  if (to) { sql += ' AND e.date<=?'; params.push(to) }
  sql += ' ORDER BY e.date DESC, e.start_time'
  const { results } = await c.env.DB.prepare(sql).bind(...params).all()
  return c.json(results)
})

app.post('/api/events', async (c) => {
  const b = await c.req.json()
  const id = uid()
  const now = ts()
  await c.env.DB.prepare(
    `INSERT INTO events (id,client_id,title,type,date,start_time,end_time,location,theme,child_count,instructions,notes,status,checklist,color,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, b.client_id ?? null, b.title, b.type ?? 'other', b.date,
    b.start_time ?? null, b.end_time ?? null, b.location ?? null,
    b.theme ?? null, b.child_count ?? 0, b.instructions ?? null,
    b.notes ?? null, b.status ?? 'pending', JSON.stringify(b.checklist ?? []),
    b.color ?? null, now, now).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM events WHERE id=?').bind(id).first(), 201)
})

app.get('/api/events/:id', async (c) => {
  const ev = await c.env.DB.prepare(
    `SELECT e.*, c.first_name||' '||c.last_name as client_name
     FROM events e LEFT JOIN clients c ON e.client_id=c.id WHERE e.id=?`
  ).bind(c.req.param('id')).first()
  if (!ev) return c.json({ error: 'Introuvable' }, 404)
  const [assignments, rentals] = await Promise.all([
    c.env.DB.prepare(
      `SELECT a.*, co.first_name||' '||co.last_name as collab_name, co.role
       FROM assignments a JOIN collaborators co ON a.collaborator_id=co.id WHERE a.event_id=?`
    ).bind(c.req.param('id')).all(),
    c.env.DB.prepare(
      `SELECT er.*, eq.name as eq_name, eq.category
       FROM equipment_rentals er JOIN equipment eq ON er.equipment_id=eq.id WHERE er.event_id=?`
    ).bind(c.req.param('id')).all(),
  ])
  return c.json({ ...ev, assignments: assignments.results, rentals: rentals.results })
})

app.put('/api/events/:id', async (c) => {
  const b = await c.req.json()
  const now = ts()
  await c.env.DB.prepare(
    `UPDATE events SET client_id=?,title=?,type=?,date=?,start_time=?,end_time=?,location=?,theme=?,child_count=?,instructions=?,notes=?,status=?,checklist=?,color=?,updated_at=? WHERE id=?`
  ).bind(b.client_id ?? null, b.title, b.type ?? 'other', b.date,
    b.start_time ?? null, b.end_time ?? null, b.location ?? null,
    b.theme ?? null, b.child_count ?? 0, b.instructions ?? null,
    b.notes ?? null, b.status ?? 'pending', JSON.stringify(b.checklist ?? []),
    b.color ?? null, now, c.req.param('id')).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM events WHERE id=?').bind(c.req.param('id')).first())
})

app.delete('/api/events/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM events WHERE id=?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

// ── EQUIPMENT ──────────────────────────────────────────────────────────────

app.get('/api/equipment', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM equipment ORDER BY category, name').all()
  return c.json(results)
})

app.post('/api/equipment', async (c) => {
  const b = await c.req.json()
  const id = uid()
  const now = ts()
  await c.env.DB.prepare(
    `INSERT INTO equipment (id,name,category,description,status,condition,photos,purchase_date,purchase_price,rental_price,deposit_amount,notes,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, b.name, b.category, b.description ?? null, b.status ?? 'available',
    b.condition ?? 'good', JSON.stringify(b.photos ?? []), b.purchase_date ?? null,
    b.purchase_price ?? null, b.rental_price ?? null, b.deposit_amount ?? null,
    b.notes ?? null, now, now).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM equipment WHERE id=?').bind(id).first(), 201)
})

app.put('/api/equipment/:id', async (c) => {
  const b = await c.req.json()
  const now = ts()
  await c.env.DB.prepare(
    `UPDATE equipment SET name=?,category=?,description=?,status=?,condition=?,photos=?,purchase_date=?,purchase_price=?,rental_price=?,deposit_amount=?,notes=?,updated_at=? WHERE id=?`
  ).bind(b.name, b.category, b.description ?? null, b.status ?? 'available',
    b.condition ?? 'good', JSON.stringify(b.photos ?? []), b.purchase_date ?? null,
    b.purchase_price ?? null, b.rental_price ?? null, b.deposit_amount ?? null,
    b.notes ?? null, now, c.req.param('id')).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM equipment WHERE id=?').bind(c.req.param('id')).first())
})

app.delete('/api/equipment/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM equipment WHERE id=?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

// ── COLLABORATORS ──────────────────────────────────────────────────────────

app.get('/api/collaborators', async (c) => {
  const role = c.req.query('role')
  let sql = 'SELECT * FROM collaborators WHERE 1=1'
  const params: string[] = []
  if (role) { sql += ' AND role=?'; params.push(role) }
  sql += ' ORDER BY last_name, first_name'
  const { results } = await c.env.DB.prepare(sql).bind(...params).all()
  return c.json(results)
})

app.post('/api/collaborators', async (c) => {
  const b = await c.req.json()
  const id = uid()
  const now = ts()
  await c.env.DB.prepare(
    `INSERT INTO collaborators (id,first_name,last_name,phone,email,address,photo,role,status,skills,languages,experience,hourly_rate,notes,documents,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, b.first_name, b.last_name, b.phone ?? null, b.email ?? null,
    b.address ?? null, b.photo ?? null, b.role ?? 'other',
    b.status ?? 'active', JSON.stringify(b.skills ?? []),
    JSON.stringify(b.languages ?? []), b.experience ?? null,
    b.hourly_rate ?? null, b.notes ?? null,
    JSON.stringify(b.documents ?? []), now, now).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM collaborators WHERE id=?').bind(id).first(), 201)
})

app.get('/api/collaborators/:id', async (c) => {
  const col = await c.env.DB.prepare('SELECT * FROM collaborators WHERE id=?').bind(c.req.param('id')).first()
  if (!col) return c.json({ error: 'Introuvable' }, 404)
  const { results: assignments } = await c.env.DB.prepare(
    `SELECT a.*, e.title, e.date, e.type FROM assignments a JOIN events e ON a.event_id=e.id
     WHERE a.collaborator_id=? ORDER BY e.date DESC`
  ).bind(c.req.param('id')).all()
  return c.json({ ...col, assignments })
})

app.put('/api/collaborators/:id', async (c) => {
  const b = await c.req.json()
  const now = ts()
  await c.env.DB.prepare(
    `UPDATE collaborators SET first_name=?,last_name=?,phone=?,email=?,address=?,photo=?,role=?,status=?,skills=?,languages=?,experience=?,hourly_rate=?,notes=?,documents=?,updated_at=? WHERE id=?`
  ).bind(b.first_name, b.last_name, b.phone ?? null, b.email ?? null,
    b.address ?? null, b.photo ?? null, b.role ?? 'other',
    b.status ?? 'active', JSON.stringify(b.skills ?? []),
    JSON.stringify(b.languages ?? []), b.experience ?? null,
    b.hourly_rate ?? null, b.notes ?? null,
    JSON.stringify(b.documents ?? []), now, c.req.param('id')).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM collaborators WHERE id=?').bind(c.req.param('id')).first())
})

app.delete('/api/collaborators/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM collaborators WHERE id=?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

// ── ASSIGNMENTS ────────────────────────────────────────────────────────────

app.get('/api/assignments', async (c) => {
  const eventId = c.req.query('event_id')
  const collabId = c.req.query('collaborator_id')
  let sql = `SELECT a.*, co.first_name||' '||co.last_name as collab_name, co.role,
             e.title as event_title, e.date as event_date, e.type as event_type
             FROM assignments a JOIN collaborators co ON a.collaborator_id=co.id
             JOIN events e ON a.event_id=e.id WHERE 1=1`
  const params: string[] = []
  if (eventId) { sql += ' AND a.event_id=?'; params.push(eventId) }
  if (collabId) { sql += ' AND a.collaborator_id=?'; params.push(collabId) }
  sql += ' ORDER BY e.date DESC'
  const { results } = await c.env.DB.prepare(sql).bind(...params).all()
  return c.json(results)
})

app.post('/api/assignments', async (c) => {
  const b = await c.req.json()
  const id = uid()
  const now = ts()
  await c.env.DB.prepare(
    `INSERT INTO assignments (id,event_id,collaborator_id,start_time,end_time,rate,status,notes,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, b.event_id, b.collaborator_id, b.start_time ?? null,
    b.end_time ?? null, b.rate ?? null, b.status ?? 'assigned', b.notes ?? null, now, now).run()
  return c.json({ id }, 201)
})

app.delete('/api/assignments/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM assignments WHERE id=?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

// ── DOCUMENTS ──────────────────────────────────────────────────────────────

app.get('/api/documents', async (c) => {
  const clientId = c.req.query('client_id')
  let sql = `SELECT d.*, c.first_name||' '||c.last_name as client_name
             FROM documents d LEFT JOIN clients c ON d.client_id=c.id WHERE 1=1`
  const params: string[] = []
  if (clientId) { sql += ' AND d.client_id=?'; params.push(clientId) }
  sql += ' ORDER BY d.created_at DESC'
  const { results } = await c.env.DB.prepare(sql).bind(...params).all()
  return c.json(results)
})

app.post('/api/documents', async (c) => {
  const b = await c.req.json()
  const id = uid()
  const now = ts()
  const { results: cnt } = await c.env.DB.prepare(
    'SELECT COUNT(*) as n FROM documents WHERE type=?'
  ).bind(b.type).all()
  const n = ((cnt[0] as { n: number })?.n ?? 0) + 1
  const prefix = b.type === 'quote' ? 'DEV' : b.type === 'invoice' ? 'FAC' : 'CTR'
  const number = `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`
  await c.env.DB.prepare(
    `INSERT INTO documents (id,client_id,event_id,type,number,status,title,items,subtotal,tax_rate,tax_amount,total,notes,valid_until,due_date,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, b.client_id ?? null, b.event_id ?? null, b.type, number,
    b.status ?? 'draft', b.title ?? null, JSON.stringify(b.items ?? []),
    b.subtotal ?? 0, b.tax_rate ?? 0, b.tax_amount ?? 0, b.total ?? 0,
    b.notes ?? null, b.valid_until ?? null, b.due_date ?? null, now, now).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM documents WHERE id=?').bind(id).first(), 201)
})

app.put('/api/documents/:id', async (c) => {
  const b = await c.req.json()
  const now = ts()
  await c.env.DB.prepare(
    `UPDATE documents SET status=?,title=?,items=?,subtotal=?,tax_rate=?,tax_amount=?,total=?,notes=?,valid_until=?,due_date=?,paid_at=?,updated_at=? WHERE id=?`
  ).bind(b.status ?? 'draft', b.title ?? null, JSON.stringify(b.items ?? []),
    b.subtotal ?? 0, b.tax_rate ?? 0, b.tax_amount ?? 0, b.total ?? 0,
    b.notes ?? null, b.valid_until ?? null, b.due_date ?? null,
    b.paid_at ?? null, now, c.req.param('id')).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM documents WHERE id=?').bind(c.req.param('id')).first())
})

app.delete('/api/documents/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM documents WHERE id=?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

// ── PRICING ────────────────────────────────────────────────────────────────

app.get('/api/pricing', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM pricing ORDER BY category, name').all()
  return c.json(results)
})

app.post('/api/pricing', async (c) => {
  const b = await c.req.json()
  const id = uid()
  const now = ts()
  await c.env.DB.prepare(
    `INSERT INTO pricing (id,category,name,description,price,unit,conditions,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, b.category, b.name, b.description ?? null, b.price,
    b.unit ?? 'hour', b.conditions ?? null, b.active ?? 1, now, now).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM pricing WHERE id=?').bind(id).first(), 201)
})

app.put('/api/pricing/:id', async (c) => {
  const b = await c.req.json()
  const now = ts()
  await c.env.DB.prepare(
    `UPDATE pricing SET category=?,name=?,description=?,price=?,unit=?,conditions=?,active=?,updated_at=? WHERE id=?`
  ).bind(b.category, b.name, b.description ?? null, b.price,
    b.unit ?? 'hour', b.conditions ?? null, b.active ?? 1, now, c.req.param('id')).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM pricing WHERE id=?').bind(c.req.param('id')).first())
})

app.delete('/api/pricing/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM pricing WHERE id=?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

// ── PARTNERS ───────────────────────────────────────────────────────────────

app.get('/api/partners', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM partners ORDER BY name').all()
  return c.json(results)
})

app.post('/api/partners', async (c) => {
  const b = await c.req.json()
  const id = uid()
  const now = ts()
  await c.env.DB.prepare(
    `INSERT INTO partners (id,name,contact_name,email,phone,commission_rate,notes,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, b.name, b.contact_name ?? null, b.email ?? null,
    b.phone ?? null, b.commission_rate ?? 0, b.notes ?? null, 1, now, now).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM partners WHERE id=?').bind(id).first(), 201)
})

// ── STATS ──────────────────────────────────────────────────────────────────

app.get('/api/stats', async (c) => {
  const [clients, events, equipment, collaborators, revenue, upcoming] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as n FROM clients').first<{ n: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM events WHERE status NOT IN ('cancelled')`).first<{ n: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM equipment WHERE status='available'`).first<{ n: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM collaborators WHERE status='active'`).first<{ n: number }>(),
    c.env.DB.prepare(`SELECT COALESCE(SUM(total),0) as total FROM documents WHERE status='paid'`).first<{ total: number }>(),
    c.env.DB.prepare(
      `SELECT e.*, c.first_name||' '||c.last_name as client_name
       FROM events e LEFT JOIN clients c ON e.client_id=c.id
       WHERE e.date >= date('now') AND e.status != 'cancelled'
       ORDER BY e.date ASC LIMIT 5`
    ).all(),
  ])
  return c.json({
    clients: clients?.n ?? 0,
    events: events?.n ?? 0,
    availableEquipment: equipment?.n ?? 0,
    activeCollaborators: collaborators?.n ?? 0,
    totalRevenue: revenue?.total ?? 0,
    upcomingEvents: upcoming.results,
  })
})

export const onRequest = handle(app)
