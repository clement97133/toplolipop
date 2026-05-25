import type { EventType, EventStatus, EquipmentCategory, EquipmentStatus, EquipmentCondition, CollaboratorRole, DocumentType, DocumentStatus } from '../types'

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  animation: 'Animation',
  babysitting: 'Baby-sitting',
  rental: 'Location',
  delivery: 'Livraison',
  other: 'Autre',
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  animation: 'bg-violet-100 text-violet-700',
  babysitting: 'bg-pink-100 text-pink-700',
  rental: 'bg-blue-100 text-blue-700',
  delivery: 'bg-amber-100 text-amber-700',
  other: 'bg-gray-100 text-gray-600',
}

export const EVENT_TYPE_CALENDAR_COLORS: Record<EventType, string> = {
  animation: '#7C3AED',
  babysitting: '#EC4899',
  rental: '#3B82F6',
  delivery: '#F59E0B',
  other: '#6B7280',
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-violet-100 text-violet-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  inflatable: 'Château gonflable',
  costume: 'Costume / Mascotte',
  decoration: 'Décoration',
  furniture: 'Mobilier',
  accessory: 'Accessoire',
}

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: 'Disponible',
  rented: 'Loué',
  maintenance: 'En maintenance',
  unavailable: 'Indisponible',
}

export const EQUIPMENT_STATUS_COLORS: Record<EquipmentStatus, string> = {
  available: 'bg-green-100 text-green-700',
  rented: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-amber-100 text-amber-700',
  unavailable: 'bg-red-100 text-red-600',
}

export const EQUIPMENT_CONDITION_LABELS: Record<EquipmentCondition, string> = {
  excellent: 'Excellent',
  good: 'Bon état',
  fair: 'Acceptable',
  poor: 'Mauvais état',
}

export const COLLABORATOR_ROLE_LABELS: Record<CollaboratorRole, string> = {
  babysitter: 'Baby-sitter / Nounou',
  animator: 'Animateur',
  delivery: 'Livreur',
  partner: 'Partenaire',
  freelance: 'Freelance',
  other: 'Autre',
}

export const COLLABORATOR_ROLE_COLORS: Record<CollaboratorRole, string> = {
  babysitter: 'bg-pink-100 text-pink-700',
  animator: 'bg-violet-100 text-violet-700',
  delivery: 'bg-amber-100 text-amber-700',
  partner: 'bg-blue-100 text-blue-700',
  freelance: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-600',
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  quote: 'Devis',
  invoice: 'Facture',
  contract: 'Contrat',
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  paid: 'Payé',
  cancelled: 'Annulé',
}

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-violet-100 text-violet-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

export const PRICING_UNIT_LABELS: Record<string, string> = {
  hour: 'heure',
  day: 'jour',
  event: 'événement',
  flat: 'forfait',
}
