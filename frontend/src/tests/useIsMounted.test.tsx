import { renderHook } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { useIsMounted } from '@/hooks/useIsMounted';

describe('useIsMounted', () => {
  it('says yes while the component is on screen', () => {
    const { result } = renderHook(() => useIsMounted());
    expect(result.current()).toBe(true);
  });

  it('says no once the component has gone, so a late answer from the server is ignored', () => {
    const { result, unmount } = renderHook(() => useIsMounted());
    unmount();
    expect(result.current()).toBe(false);
  });

  it('still says yes in React\'s StrictMode, which mounts, cleans up and mounts again in development', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;
    const { result } = renderHook(() => useIsMounted(), { wrapper });
    expect(result.current()).toBe(true);
  });

  it('gives back the same function on every render, so it is safe to list as a dependency', () => {
    const { result, rerender } = renderHook(() => useIsMounted());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
