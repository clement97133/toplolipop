import type { Client, Event, Equipment, Collaborator, Assignment, AppDocument, Pricing, Partner, Stats } from '../types'

const BASE = '/api'

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Erreur ${res.status}`)
  }
  return res.json() as Promise<T>
}

const get = <T>(url: string) => req<T>(url)
const post = <T>(url: string, data: unknown) => req<T>(url, { method: 'POST', body: JSON.stringify(data) })
const put = <T>(url: string, data: unknown) => req<T>(url, { method: 'PUT', body: JSON.stringify(data) })
const del = <T>(url: string) => req<T>(url, { method: 'DELETE' })

export const clientsApi = {
  list: (q?: string) => get<Client[]>(`${BASE}/clients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  get: (id: string) => get<Client>(`${BASE}/clients/${id}`),
  create: (d: Partial<Client>) => post<Client>(`${BASE}/clients`, d),
  update: (id: string, d: Partial<Client>) => put<Client>(`${BASE}/clients/${id}`, d),
  delete: (id: string) => del<{ ok: boolean }>(`${BASE}/clients/${id}`),
}

export const eventsApi = {
  list: (p?: { client_id?: string; from?: string; to?: string }) => {
    const qs = new URLSearchParams()
    if (p?.client_id) qs.set('client_id', p.client_id)
    if (p?.from) qs.set('from', p.from)
    if (p?.to) qs.set('to', p.to)
    const q = qs.toString()
    return get<Event[]>(`${BASE}/events${q ? `?${q}` : ''}`)
  },
  get: (id: string) => get<Event>(`${BASE}/events/${id}`),
  create: (d: Partial<Event>) => post<Event>(`${BASE}/events`, d),
  update: (id: string, d: Partial<Event>) => put<Event>(`${BASE}/events/${id}`, d),
  delete: (id: string) => del<{ ok: boolean }>(`${BASE}/events/${id}`),
}

export const equipmentApi = {
  list: () => get<Equipment[]>(`${BASE}/equipment`),
  create: (d: Partial<Equipment>) => post<Equipment>(`${BASE}/equipment`, d),
  update: (id: string, d: Partial<Equipment>) => put<Equipment>(`${BASE}/equipment/${id}`, d),
  delete: (id: string) => del<{ ok: boolean }>(`${BASE}/equipment/${id}`),
}

export const collaboratorsApi = {
  list: (role?: string) => get<Collaborator[]>(`${BASE}/collaborators${role ? `?role=${role}` : ''}`),
  get: (id: string) => get<Collaborator>(`${BASE}/collaborators/${id}`),
  create: (d: Partial<Collaborator>) => post<Collaborator>(`${BASE}/collaborators`, d),
  update: (id: string, d: Partial<Collaborator>) => put<Collaborator>(`${BASE}/collaborators/${id}`, d),
  delete: (id: string) => del<{ ok: boolean }>(`${BASE}/collaborators/${id}`),
}

export const assignmentsApi = {
  list: (p?: { event_id?: string; collaborator_id?: string }) => {
    const qs = new URLSearchParams()
    if (p?.event_id) qs.set('event_id', p.event_id)
    if (p?.collaborator_id) qs.set('collaborator_id', p.collaborator_id)
    const q = qs.toString()
    return get<Assignment[]>(`${BASE}/assignments${q ? `?${q}` : ''}`)
  },
  create: (d: { event_id: string; collaborator_id: string; start_time?: string; end_time?: string; rate?: number }) =>
    post<{ id: string }>(`${BASE}/assignments`, d),
  delete: (id: string) => del<{ ok: boolean }>(`${BASE}/assignments/${id}`),
}

export const documentsApi = {
  list: (clientId?: string) => get<AppDocument[]>(`${BASE}/documents${clientId ? `?client_id=${clientId}` : ''}`),
  create: (d: Partial<AppDocument>) => post<AppDocument>(`${BASE}/documents`, d),
  update: (id: string, d: Partial<AppDocument>) => put<AppDocument>(`${BASE}/documents/${id}`, d),
  delete: (id: string) => del<{ ok: boolean }>(`${BASE}/documents/${id}`),
}

export const pricingApi = {
  list: () => get<Pricing[]>(`${BASE}/pricing`),
  create: (d: Partial<Pricing>) => post<Pricing>(`${BASE}/pricing`, d),
  update: (id: string, d: Partial<Pricing>) => put<Pricing>(`${BASE}/pricing/${id}`, d),
  delete: (id: string) => del<{ ok: boolean }>(`${BASE}/pricing/${id}`),
}

export const partnersApi = {
  list: () => get<Partner[]>(`${BASE}/partners`),
  create: (d: Partial<Partner>) => post<Partner>(`${BASE}/partners`, d),
}

export const statsApi = {
  get: () => get<Stats>(`${BASE}/stats`),
}
