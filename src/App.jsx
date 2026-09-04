import { Toaster } from '@/components/ui/toast'
import AppShell from '@/components/layout/AppShell'
import { ThemeProvider } from '@/components/layout/theme-provider'

function App() {
  return (
    <ThemeProvider>
      <AppShell />
      <Toaster />
    </ThemeProvider>
  )
}

export default App
