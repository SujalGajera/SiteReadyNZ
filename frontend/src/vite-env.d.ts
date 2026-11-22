/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Tells TypeScript about Vite's special import.meta.env variables
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_VAPID_PUBLIC_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
