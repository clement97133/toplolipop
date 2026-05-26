import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
  gold?: boolean  // variante dorée
}

const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }

export function Card({ children, className, hover, onClick, padding = 'md', gold }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-3xl border shadow-card',
        gold ? 'border-brand-100 shadow-card-gold' : 'border-cream-300/60',
        hover && 'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200',
        onClick && 'cursor-pointer active:scale-[0.98]',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps { title: string; subtitle?: string; action?: ReactNode; className?: string }
export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div>
        <h3 className="text-sm font-bold text-navy-700">{title}</h3>
        {subtitle && <p className="text-xs text-navy-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  )
}
