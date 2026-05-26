import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  dot?: boolean
  variant?: 'default' | 'gold' | 'navy' | 'success' | 'danger' | 'warning'
}

const variantStyles = {
  default: 'bg-cream-200 text-navy-600',
  gold:    'bg-brand-100 text-brand-700',
  navy:    'bg-navy-100 text-navy-700',
  success: 'bg-green-50 text-green-700',
  danger:  'bg-red-50 text-red-600',
  warning: 'bg-amber-50 text-amber-700',
}

export function Badge({ children, className, dot, variant }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
      variant ? variantStyles[variant] : '',
      className
    )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  )
}
