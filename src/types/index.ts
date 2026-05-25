export interface Client {
  id: string
  first_name: string
  last_name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  event_address?: string | null
  notes?: string | null
  preferences?: string | null
  tags: string | string[]
  child_birthdays: string | string[]
  partner_id?: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  client_id?: string | null
  client_name?: string | null
  title: string
  type: EventType
  date: string
  start_time?: string | null
  end_time?: string | null
  location?: string | null
  theme?: string | null
  child_count: number
  instructions?: string | null
  notes?: string | null
  status: EventStatus
  checklist: string | ChecklistItem[]
  color?: string | null
  assignments?: Assignment[]
  rentals?: EquipmentRental[]
  created_at: string
  updated_at: string
}

export type EventType = 'animation' | 'babysitting' | 'rental' | 'delivery' | 'other'
export type EventStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

export interface ChecklistItem {
  id: string
  label: string
  done: boolean
}

export interface Equipment {
  id: string
  name: string
  category: EquipmentCategory
  description?: string | null
  status: EquipmentStatus
  condition: EquipmentCondition
  photos: string | string[]
  purchase_date?: string | null
  purchase_price?: number | null
  rental_price?: number | null
  deposit_amount?: number | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export type EquipmentCategory = 'inflatable' | 'costume' | 'decoration' | 'furniture' | 'accessory'
export type EquipmentStatus = 'available' | 'rented' | 'maintenance' | 'unavailable'
export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'poor'

export interface EquipmentRental {
  id: string
  event_id: string
  equipment_id: string
  eq_name?: string
  category?: string
  quantity: number
  delivery_datetime?: string | null
  pickup_datetime?: string | null
  condition_before?: string | null
  condition_after?: string | null
  deposit_amount: number
  deposit_returned: number | boolean
  notes?: string | null
  created_at: string
}

export interface Collaborator {
  id: string
  first_name: string
  last_name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  photo?: string | null
  role: CollaboratorRole
  status: 'active' | 'inactive'
  skills: string | string[]
  languages: string | string[]
  experience?: string | null
  hourly_rate?: number | null
  notes?: string | null
  documents: string | string[]
  assignments?: Assignment[]
  created_at: string
  updated_at: string
}

export type CollaboratorRole = 'babysitter' | 'animator' | 'delivery' | 'partner' | 'freelance' | 'other'

export interface Assignment {
  id: string
  event_id: string
  collaborator_id: string
  collab_name?: string
  event_title?: string
  event_date?: string
  event_type?: string
  role?: string
  start_time?: string | null
  end_time?: string | null
  rate?: number | null
  status: 'assigned' | 'confirmed' | 'completed' | 'cancelled'
  evaluation?: number | null
  evaluation_notes?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface AppDocument {
  id: string
  client_id?: string | null
  client_name?: string | null
  event_id?: string | null
  type: DocumentType
  number: string
  status: DocumentStatus
  title?: string | null
  items: string | DocumentItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  notes?: string | null
  valid_until?: string | null
  due_date?: string | null
  paid_at?: string | null
  created_at: string
  updated_at: string
}

export type DocumentType = 'quote' | 'invoice' | 'contract'
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'paid' | 'cancelled'

export interface DocumentItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Pricing {
  id: string
  category: 'babysitting' | 'event' | 'equipment' | 'special'
  name: string
  description?: string | null
  price: number
  unit: 'hour' | 'day' | 'event' | 'flat'
  conditions?: string | null
  active: number | boolean
  created_at: string
  updated_at: string
}

export interface Partner {
  id: string
  name: string
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  commission_rate: number
  notes?: string | null
  active: number | boolean
  created_at: string
  updated_at: string
}

export interface Stats {
  clients: number
  events: number
  availableEquipment: number
  activeCollaborators: number
  totalRevenue: number
  upcomingEvents: (Event & { client_name?: string })[]
}
