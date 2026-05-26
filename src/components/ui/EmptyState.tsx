import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cream-200 to-cream-300 flex items-center justify-center mb-4 shadow-inner">
        <Icon size={26} className="text-brand-500" />
      </div>
      <h3 className="text-sm font-bold text-navy-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-navy-400 max-w-xs mb-5 leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  )
}
