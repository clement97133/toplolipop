import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-navy-700">
          {label}
          {props.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={3}
        className={cn(
          'px-4 py-2.5 rounded-2xl border bg-white text-sm text-navy-800 placeholder:text-navy-300 transition-all resize-y',
          'focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400',
          error ? 'border-red-300 bg-red-50' : 'border-cream-300 hover:border-cream-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'
