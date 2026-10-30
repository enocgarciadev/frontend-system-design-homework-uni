import { Toaster } from '@/components/ui/toast'
import AuthGate from '@/features/auth/AuthGate'
import { ThemeProvider } from '@/components/layout/theme-provider'

function App() {
  return (
    <ThemeProvider>
      <AuthGate />
      <Toaster />
    </ThemeProvider>
  )
}

export default App
