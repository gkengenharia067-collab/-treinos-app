import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/context/auth'

export function RequireAuth() {
  const { usuario, carregando, configurado } = useAuth()
  const location = useLocation()

  if (!configurado) {
    return <Navigate to="/login" replace />
  }
  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <AppShell />
}