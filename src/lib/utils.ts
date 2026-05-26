import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseJson<T>(value: string | T[] | null | undefined, fallback: T[] = []): T[] {
  if (!value) return fallback
  if (Array.isArray(value)) return value
  try { return JSON.parse(value as string) } catch { return fallback }
}

export function formatDate(date: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return '—'
  try {
    // Date-only strings (YYYY-MM-DD) parse as UTC midnight → add noon to avoid day-shift in UTC-X timezones (Saint-Barth = UTC-4)
    const d = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(date + 'T12:00:00') : new Date(date)
    return new Intl.DateTimeFormat('fr-FR', opts ?? { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  } catch { return date }
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
}
