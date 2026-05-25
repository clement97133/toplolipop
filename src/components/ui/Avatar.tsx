import { cn } from '../../lib/utils'

const COLORS = [
  'bg-violet-200 text-violet-700',
  'bg-pink-200 text-pink-700',
  'bg-blue-200 text-blue-700',
  'bg-emerald-200 text-emerald-700',
  'bg-amber-200 text-amber-700',
  'bg-teal-200 text-teal-700',
  'bg-orange-200 text-orange-700',
]

function colorFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

interface AvatarProps {
  firstName: string
  lastName: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-14 h-14 text-lg' }

export function Avatar({ firstName, lastName, size = 'md', className }: AvatarProps) {
  const name = `${firstName}${lastName}`
  return (
    <div className={cn('rounded-full flex items-center justify-center font-semibold flex-shrink-0', sizes[size], colorFor(name), className)}>
      {firstName.charAt(0).toUpperCase()}{lastName.charAt(0).toUpperCase()}
    </div>
  )
}
