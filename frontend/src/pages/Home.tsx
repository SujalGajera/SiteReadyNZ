import { useAuth } from '@/hooks/useAuth'

/** Time-of-day greeting, using the device clock */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// Landing page after sign-in. Phase 3 and 4 replace the body with the equipment overview (managers)
// and the inspection list (staff).
export default function HomePage() {
  const { user } = useAuth()
  const firstName = user?.name.split(' ')[0]

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">
        {getGreeting()}, {firstName}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {user?.role === 'manager'
          ? 'Your equipment list and inspection schedule will appear here.'
          : 'Your assigned inspections will appear here.'}
      </p>
    </div>
  )
}
