import { useCallback, useEffect, useRef } from 'react'

/**
 * Returns a function that says whether the component is still on screen.
 *
 * Why: a hook that loads data from the server may finish after the person has already moved to another
 * page. Setting state on a page that is gone wastes memory and can show stale data. Check
 * `isMounted()` before setting state after an `await`.
 *
 * Call it before any effect that loads data, so the flag is already true when that effect runs.
 */
export function useIsMounted(): () => boolean {
  const mounted = useRef(false)

  useEffect(() => {
    // Set to true again on every mount, because React's StrictMode mounts, cleans up, and mounts again in development
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  return useCallback(() => mounted.current, [])
}
