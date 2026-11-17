import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
// Fonts are bundled with the app (not loaded from Google) so they also work offline
import '@fontsource-variable/instrument-sans'
import '@fontsource-variable/bricolage-grotesque'
import { AuthProvider } from '@/context/AuthContext'
import { OfflineProvider } from '@/context/OfflineContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import App from './App'
import './index.css'

// Provider order matters: the error boundary wraps everything so a crash anywhere shows the
// fallback screen. MotionConfig makes every animation respect the device's "reduce motion" setting.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AuthProvider>
            <OfflineProvider>
              <TooltipProvider delayDuration={300}>
                <App />
                <Toaster />
              </TooltipProvider>
            </OfflineProvider>
          </AuthProvider>
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  </React.StrictMode>
)
