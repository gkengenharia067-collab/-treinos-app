import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AccessGate } from '@/components/AccessGate'
import { RequireAuth } from '@/components/RequireAuth'
import { AuthProvider } from '@/context/auth'
import { Cadastro } from '@/pages/Cadastro'
import { Dashboard } from '@/pages/Dashboard'
import { Evolucao } from '@/pages/Evolucao'
import { Login } from '@/pages/Login'
import { MedidasNova } from '@/pages/MedidasNova'
import { Perfil } from '@/pages/Perfil'
import { TreinoDetalhe } from '@/pages/TreinoDetalhe'
import { Treinos } from '@/pages/Treinos'

export default function App() {
  return (
    <AccessGate>
      <BrowserRouter>
        <AuthProvider>
          <Toaster richColors position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/treinos" element={<Treinos />} />
              <Route path="/treino/:sessaoId" element={<TreinoDetalhe />} />
              <Route path="/evolucao" element={<Evolucao />} />
              <Route path="/medidas/nova" element={<MedidasNova />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </AccessGate>
  )
}
