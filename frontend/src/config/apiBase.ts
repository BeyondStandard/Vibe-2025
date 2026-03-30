/**
 * Base URL for API requests (no trailing slash).
 * Empty string uses same-origin paths (Vite dev proxy forwards `/api` to FastAPI).
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw != null && String(raw).trim() !== "") {
    return String(raw).replace(/\/$/, "");
  }
  return "";
}

/** Absolute or root-relative URL for an API path starting with `/api`. */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  if (!base) {
    return p;
  }
  return `${base}${p}`;
}
