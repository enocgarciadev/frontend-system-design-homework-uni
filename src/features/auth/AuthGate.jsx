import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

function AuthGate() {
  const [state, setState] = useState('checking')
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    fetch(`${baseUrl}/api/auth/me`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null
        const data = await response.json()
        return data.user
      })
      .then((current) => {
        if (alive) {
          setUser(current)
          setState(current ? 'authenticated' : 'guest')
        }
      })
      .catch(() => { if (alive) setState('guest') })
    return () => { alive = false }
  }, [])

  async function login(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo iniciar sesión.')
      setUser(payload.user)
      setPassword('')
      setState('authenticated')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    try {
      const response = await apiFetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error('No se pudo cerrar sesión.')
      setUser(null)
      setEmail('')
      setPassword('')
      setState('guest')
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  if (state === 'checking') {
    return <main className="grid min-h-svh place-items-center p-4" role="status">Verificando sesión...</main>
  }
  if (state === 'authenticated' && user) {
    return (
      <>
        {error && <p role="alert" className="p-2 text-destructive">{error}</p>}
        <AppShell user={user} onLogout={logout} />
      </>
    )
  }
  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Ingresá con tu cuenta de PulpeStock Web para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={login}>
            {error && <p role="alert" className="rounded-md border border-destructive p-2 text-destructive">{error}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Correo electrónico</Label>
              <Input id="login-email" type="email" autoComplete="username" required value={email}
                onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input id="login-password" type="password" autoComplete="current-password" required value={password}
                onChange={(event) => setPassword(event.target.value)} />
            </div>
            <Button type="submit" className="h-10" disabled={busy}>{busy ? 'Ingresando...' : 'Ingresar'}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

export default AuthGate
