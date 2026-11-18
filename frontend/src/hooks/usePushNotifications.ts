import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { disablePush, enablePush, readPushState, rebindDeviceToCurrentUser, type PushState } from '@/services/pushClient'
import { getErrorMessage } from '@/services/api'

/**
 * Turning notifications on and off for this device.
 * `state` is null until the first check has finished, so the card does not flash the wrong thing.
 */
export function usePushNotifications() {
  const { user } = useAuth()
  const [state, setState] = useState<PushState | null>(null)
  const [isWorking, setIsWorking] = useState(false)

  useEffect(() => {
    let cancelled = false
    readPushState()
      .then((current) => !cancelled && setState(current))
      .catch(() => !cancelled && setState('unsupported'))
    return () => {
      cancelled = true
    }
  }, [])

  // Whoever is signed in now becomes the owner of this device's alerts (matters on a shared phone)
  useEffect(() => {
    if (state === 'on' && user) void rebindDeviceToCurrentUser().catch(() => undefined)
  }, [state, user])

  const turnOn = useCallback(async () => {
    setIsWorking(true)
    try {
      const result = await enablePush()
      setState(result)
      if (result === 'on') toast.success('Reminders are on', { description: 'This device will tell you when a check is due.' })
      // A "no" from the person is a normal answer; the card explains how to change it later
    } catch (error) {
      toast.error('Could not turn reminders on', { description: getErrorMessage(error, 'Please try again.') })
    } finally {
      setIsWorking(false)
    }
  }, [])

  const turnOff = useCallback(async () => {
    setIsWorking(true)
    try {
      setState(await disablePush())
    } catch (error) {
      toast.error('Could not turn reminders off', { description: getErrorMessage(error, 'Please try again.') })
    } finally {
      setIsWorking(false)
    }
  }, [])

  return { state, isWorking, turnOn, turnOff }
}
