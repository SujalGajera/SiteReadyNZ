import { useId, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/utils/cn'

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  /** Shown under the input in brick red. Also read out by screen readers. */
  error?: string
  /** Quiet helper text shown when there is no error */
  hint?: string
}

/**
 * Label + input + message. The label is always visible (never placeholder-only, per AGENT_RULES).
 * Password inputs get a show/hide button, which helps on phones where typos are common.
 */
export function FormField({ label, error, hint, type = 'text', className, ...inputProps }: FormFieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const [isRevealed, setIsRevealed] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && isRevealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(error && 'border-danger focus-visible:ring-danger', isPassword && 'pr-11', className)}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setIsRevealed((current) => !current)}
            aria-label={isRevealed ? 'Hide password' : 'Show password'}
            aria-pressed={isRevealed}
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
          >
            {isRevealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {(error || hint) && (
        <p id={messageId} className={cn('text-[13px] leading-snug', error ? 'text-danger' : 'text-muted-foreground')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
