import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-navy-700">
          {label}
          {props.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'h-10 px-4 rounded-2xl border bg-white text-sm text-navy-800 placeholder:text-navy-300 transition-all',
          'focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400',
          error ? 'border-red-300 bg-red-50' : 'border-cream-300 hover:border-cream-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-navy-400">{hint}</p>}
    </div>
  )
)
Input.displayName = 'Input'
