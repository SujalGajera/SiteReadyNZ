import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
// Fonts are bundled with the app (not loaded from Google) so they also work offline
import '@fontsource-variable/instrument-sans'
import '@fontsource-variable/bricolage-grotesque'
import { AuthProvider } from '@/context/AuthContext'
import { OfflineProvider } from '@/context/OfflineContext'
import { SyncProvider } from '@/context/SyncContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { registerServiceWorker } from '@/sw/registerServiceWorker'
import App from './App'
import './index.css'

// Starts the offline support (service worker) before anything is drawn
registerServiceWorker()

// Provider order matters: the error boundary wraps everything so a crash anywhere shows the
// fallback screen. MotionConfig makes every animation respect the device's "reduce motion" setting.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AuthProvider>
            <OfflineProvider>
              <SyncProvider>
                <TooltipProvider delayDuration={300}>
                  <App />
                  <Toaster />
                </TooltipProvider>
              </SyncProvider>
            </OfflineProvider>
          </AuthProvider>
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  </React.StrictMode>
)
