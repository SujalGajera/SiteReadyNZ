import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

// Colours are CSS variables (defined in src/index.css) so ShadCN components and our
// own markup share one palette. Change a value there and the whole app follows.
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Both fonts ship inside the app bundle (see main.tsx) so they also load offline.
        sans: ['"Instrument Sans Variable"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        display: ['"Bricolage Grotesque Variable"', '"Instrument Sans Variable"', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        fern: 'hsl(var(--fern))',
        kowhai: { DEFAULT: 'hsl(var(--kowhai))', soft: 'hsl(var(--kowhai-soft))' },
        canvas: 'hsl(var(--canvas))',
        // Status colours used by badges, bars and the Pass / Fail / Flag buttons.
        // `soft` is the pale background, `DEFAULT` is the strong text/border colour.
        ok: { DEFAULT: 'hsl(var(--ok))', soft: 'hsl(var(--ok-soft))' },
        warn: { DEFAULT: 'hsl(var(--warn))', soft: 'hsl(var(--warn-soft))' },
        overdue: { DEFAULT: 'hsl(var(--overdue))', soft: 'hsl(var(--overdue-soft))' },
        danger: { DEFAULT: 'hsl(var(--danger))', soft: 'hsl(var(--danger-soft))' },
      },
      borderRadius: {
        // AGENT_RULES: lg (8px) for cards, md (6px) for inputs
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      transitionTimingFunction: {
        // The "snappy spring out" curve from AGENT_RULES
        snap: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [animate],
}

export default config
