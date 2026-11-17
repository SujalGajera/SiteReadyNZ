import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/utils/formatters'

/** Who is signed in, with a sign-out button. Sits at the bottom of the sidebar and the phone menu. */
export function UserCard() {
  const { user, logout } = useAuth()

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-background/70 p-2.5">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground"
        aria-hidden="true"
      >
        {getInitials(user?.name)}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold">{user?.name}</p>
        <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
      </div>
      <button
        type="button"
        onClick={() => void logout()}
        aria-label="Sign out"
        title="Sign out"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LogOut className="size-[18px]" strokeWidth={1.75} />
      </button>
    </div>
  )
}
