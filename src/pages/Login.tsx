import { useState } from 'react'
import { Dumbbell, Loader2, LogIn } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth'
import { createSupabaseError } from '@/lib/supabase'

export function Login() {
  const { entrar, usuario, configurado } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!configurado) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" /> Treina+
            </CardTitle>
            <CardDescription>Configuração pendente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Crie um projeto no Supabase, rode as migrations de <code>supabase/migrations</code> e defina no arquivo{' '}
              <code>.env</code>:
            </p>
            <pre className="rounded-md bg-muted p-3 text-xs">VITE_SUPABASE_URL=…&#10;VITE_SUPABASE_ANON_KEY=…</pre>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (usuario) return <Navigate to="/dashboard" replace />

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      await entrar(email, senha)
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(createSupabaseError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Treina+</CardTitle>
          </div>
          <CardDescription>Entre para treinar com seu plano personalizado.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Entrar
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="font-medium text-primary underline-offset-4 hover:underline">
              Criar conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}