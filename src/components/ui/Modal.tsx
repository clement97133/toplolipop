import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(
        'relative w-full bg-cream-50 flex flex-col max-h-[92vh] animate-slide-up shadow-modal',
        // Mobile: slide-up depuis le bas
        'rounded-t-4xl sm:rounded-3xl',
        sizes[size]
      )}>
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-cream-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <h2 className="text-base font-bold text-navy-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-cream-200 text-navy-400 hover:text-navy-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Séparateur doré */}
        <div className="mx-6 h-px bg-gradient-to-r from-brand-200 via-brand-300 to-transparent flex-shrink-0" />

        {/* Corps */}
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0 border-t border-cream-200">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
