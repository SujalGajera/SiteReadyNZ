// config/env.ts — The one place the app reads settings from the build (Vite's import.meta.env).
// Keeping it in one small file means the rest of the code never touches Vite-only syntax,
// and tests can swap this file for a fixed value (see jest.config.cjs).

/** Where the backend API lives. Set VITE_API_URL in frontend/.env to change it. */
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:5000'
