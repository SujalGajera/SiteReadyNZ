import { useId } from 'react'
import type { UserRole } from '@/types'
import { cn } from '@/utils/cn'

const roleOptions: { value: UserRole; title: string; description: string }[] = [
  { value: 'manager', title: 'Manager', description: 'Keeps the equipment list and assigns checks' },
  { value: 'staff', title: 'Staff', description: 'Carries out inspections on site' },
]

interface RoleChooserProps {
  value: UserRole
  onChange: (role: UserRole) => void
}

/** Two big radio cards. Real radio inputs underneath, so keyboard and screen readers work. */
export function RoleChooser({ value, onChange }: RoleChooserProps) {
  const groupName = useId()

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium leading-none">I am signing up as</legend>
      <div className="grid grid-cols-2 gap-2.5">
        {roleOptions.map((option) => (
          <label key={option.value} className="block cursor-pointer">
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'block min-h-[76px] rounded-lg border bg-card p-3 transition-colors duration-150',
                'hover:border-primary/40 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
                value === option.value && 'border-primary bg-accent'
              )}
            >
              <span className="block text-sm font-semibold">{option.title}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{option.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
