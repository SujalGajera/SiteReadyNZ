import { Bell, BellOff, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { usePushNotifications } from '@/hooks/usePushNotifications'

/**
 * A small card above the user card: switch reminders on or off for this device.
 * It always explains the situation in words, including when the person has blocked notifications
 * or the browser cannot do them, so nothing looks broken.
 */
export function NotificationCard() {
  const { user } = useAuth()
  const { state, isWorking, turnOn, turnOff } = usePushNotifications()

  if (state === null) return null

  const purpose = user?.role === 'manager' ? 'when a check is more than a day late' : 'the day before a check is due'

  return (
    <section aria-label="Notifications" className="rounded-xl border bg-background/70 p-3">
      {state === 'on' ? (
        <div className="flex items-center gap-3">
          <BellRing className="size-[18px] shrink-0 text-ok" strokeWidth={1.75} aria-hidden="true" />
          <p className="min-w-0 flex-1 text-[13px] leading-snug">
            <span className="block font-semibold">Reminders are on</span>
            <span className="text-muted-foreground">Alerts {purpose}.</span>
          </p>
          <Button variant="ghost" size="sm" className="h-9 shrink-0 px-2 text-xs" loading={isWorking} onClick={() => void turnOff()}>
            Turn off
          </Button>
        </div>
      ) : state === 'off' ? (
        <div className="space-y-2.5">
          <p className="flex items-start gap-2.5 text-[13px] leading-snug">
            <Bell className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            <span>
              <span className="block font-semibold">Get reminders</span>
              <span className="text-muted-foreground">We will alert you {purpose}.</span>
            </span>
          </p>
          <Button size="sm" variant="outline" className="h-11 w-full bg-card" loading={isWorking} onClick={() => void turnOn()}>
            Turn on reminders
          </Button>
        </div>
      ) : (
        <p className="flex items-start gap-2.5 text-[13px] leading-snug">
          <BellOff className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
          <span>
            <span className="block font-semibold">{state === 'denied' ? 'Reminders are blocked' : 'Reminders are not available here'}</span>
            <span className="text-muted-foreground">
              {state === 'denied'
                ? 'You said no to notifications. To change that, open this site\u2019s settings in your browser and allow notifications. The app works fine without them.'
                : 'This browser cannot send them. On an iPhone, add SiteReady to your Home Screen first, then open it from there.'}
            </span>
          </span>
        </p>
      )}
    </section>
  )
}
