const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

export async function apiFetch(path, options = {}) {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers = new Headers(options.headers ?? {})
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const response = await fetch(`${apiBaseUrl}/api/auth/me`, { cache: 'no-store' })
    if (!response.ok) throw new Error('La sesión ha expirado. Iniciá sesión nuevamente.')
    const data = await response.json()
    headers.set('X-CSRF-Token', data.csrfToken)
  }
  return fetch(`${apiBaseUrl}${path}`, { ...options, headers })
}
