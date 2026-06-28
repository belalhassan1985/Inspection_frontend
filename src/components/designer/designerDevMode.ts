/**
 * Returns true when the current page URL contains ?dev=1.
 * Used to gate developer-only UI (diagnostics, debug panels).
 * URL is fixed for the session so no hook is needed.
 */
export function isDesignerDevMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('dev') === '1';
  } catch {
    return false;
  }
}
