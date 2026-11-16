// pages/shared/Settings.tsx — Settings page available to both roles
// Shows account information and push notification opt-in.

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { subscribeToPush } from '../../services/pushService'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [pushStatus, setPushStatus] = useState<'idle' | 'loading' | 'enabled' | 'denied'>('idle')

  async function handleEnablePush() {
    setPushStatus('loading')
    try {
      // subscribeToPush handles permission request internally and degrades gracefully
      await subscribeToPush()
      // Check if permission was actually granted after the call
      const finalPermission = Notification.permission
      if (finalPermission === 'denied') {
        setPushStatus('denied')
      } else {
        setPushStatus('enabled')
      }
    } catch (err) {
      console.error('Push subscription failed:', err)
      setPushStatus('idle')
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-800">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage your account and notification preferences.
        </p>
      </div>

      {/* Account details */}
      <Card>
        <h2 className="text-sm font-semibold text-zinc-700 mb-4">Your account</h2>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Name</p>
            <p className="text-sm text-zinc-800">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Email</p>
            <p className="text-sm text-zinc-800">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Role</p>
            <p className="text-sm text-zinc-800 capitalize">{user?.role}</p>
          </div>
        </div>
      </Card>

      {/* Push notifications */}
      <Card>
        <h2 className="text-sm font-semibold text-zinc-700 mb-1">Push notifications</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Enable browser notifications to get reminders about upcoming and overdue inspections.
        </p>

        {pushStatus === 'enabled' && (
          <p className="text-sm text-green-700 font-medium">
            Notifications are enabled on this device.
          </p>
        )}

        {pushStatus === 'denied' && (
          <p className="text-sm text-red-600">
            Notifications were blocked. Please allow them in your browser settings and try again.
          </p>
        )}

        {(pushStatus === 'idle' || pushStatus === 'loading') && (
          <Button
            variant="outline"
            loading={pushStatus === 'loading'}
            onClick={handleEnablePush}
          >
            Enable notifications
          </Button>
        )}
      </Card>

      {/* Sign out */}
      <Card>
        <h2 className="text-sm font-semibold text-zinc-700 mb-1">Sign out</h2>
        <p className="text-sm text-zinc-500 mb-4">
          You will be redirected to the login page.
        </p>
        <Button variant="ghost" onClick={logout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
          Sign out
        </Button>
      </Card>
    </div>
  )
}
