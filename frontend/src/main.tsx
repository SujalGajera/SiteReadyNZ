import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Inter is bundled with the app (not loaded from Google) so it also works offline
import '@fontsource-variable/inter'
import { AuthProvider } from '@/context/AuthContext'
import { OfflineProvider } from '@/context/OfflineContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import App from './App'
import './index.css'

// Provider order matters: the error boundary wraps everything so a crash anywhere
// shows the fallback screen, and the router sits outside the providers that may navigate.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
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
    </ErrorBoundary>
  </React.StrictMode>
)
