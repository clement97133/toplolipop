import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

interface Tab { id: string; label: string; icon?: ReactNode; count?: number }

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  variant?: 'underline' | 'pills'
  className?: string
}

export function Tabs({ tabs, active, onChange, variant = 'underline', className }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className={cn('flex gap-1.5 p-1.5 bg-cream-200 rounded-2xl', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex-1 justify-center',
              active === tab.id
                ? 'bg-white text-navy-700 shadow-card'
                : 'text-navy-400 hover:text-navy-600'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-bold',
                active === tab.id ? 'bg-brand-100 text-brand-600' : 'bg-cream-300 text-navy-400'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  // Underline
  return (
    <div className={cn('flex gap-1 border-b border-cream-300', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap',
            active === tab.id
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-navy-400 hover:text-navy-700 hover:border-cream-400'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-bold',
              active === tab.id ? 'bg-brand-100 text-brand-600' : 'bg-cream-200 text-navy-400'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
