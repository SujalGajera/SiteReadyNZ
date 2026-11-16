import { useOffline } from '@/context/OfflineContext'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Landing page placeholder. It is replaced by the real role-based home in Phase 2/3.
export default function HomePage() {
  const { isOnline } = useOffline()

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">SiteReady NZ</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The app shell is running. You are currently {isOnline ? 'online' : 'offline'}.
      </p>
      <Button className="mt-5" onClick={() => toast.success('Toasts are working')}>
        Test a toast
      </Button>
    </div>
  )
}
