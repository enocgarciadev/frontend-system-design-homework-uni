import { useEffect, useState } from 'react'
import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

function ApiStatus() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const controller = new AbortController()

    async function checkApi() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/health`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        if (!response.ok) throw new Error('API no disponible')
        const payload = await response.json()
        if (payload.status !== 'ok') throw new Error('Estado inesperado')
        setStatus('connected')
      } catch (error) {
        if (!controller.signal.aborted) setStatus('disconnected')
      }
    }

    checkApi()
    return () => controller.abort()
  }, [])

  const label =
    status === 'connected' ? 'API conectada'
      : status === 'disconnected' ? 'API sin conexión'
        : 'Verificando API'
  const Icon =
    status === 'connected' ? CircleCheck
      : status === 'disconnected' ? CircleAlert
        : LoaderCircle

  return (
    <div
      role="status"
      aria-label={`Estado de API: ${label}`}
      title={label}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-xs text-muted-foreground sm:px-2"
    >
      <Icon
        aria-hidden="true"
        className={`size-4 ${status === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : status === 'disconnected' ? 'text-destructive' : 'animate-spin'}`}
      />
      <span className="hidden md:inline">{label}</span>
    </div>
  )
}

export default ApiStatus
