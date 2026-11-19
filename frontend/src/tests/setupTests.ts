// Runs before every test file. Adds browser features that the pretend browser (jsdom) does not have.
import '@testing-library/jest-dom';

// Animations and some layouts ask the browser to watch element sizes. jsdom has no such thing, so do nothing.
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (FakeResizeObserver as unknown as typeof ResizeObserver);

// "Does the person prefer reduced motion?" Answer yes in tests, so animations finish at once.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

// Scrolling into view is not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = () => undefined;

// Random ids: use a counter so tests are predictable
let idCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => `test-uuid-${++idCounter}` },
  configurable: true,
});
