import { useState, type FormEvent, type ReactNode } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CHAVE_SESSAO = 'treina_acesso_liberado'
const SENHA = import.meta.env.VITE_APP_ACCESS_PASSWORD as string | undefined

export function AccessGate({ children }: { children: ReactNode }) {
  const [liberado, setLiberado] = useState(() => {
    try {
      return sessionStorage.getItem(CHAVE_SESSAO) === 'true'
    } catch {
      return false
    }
  })
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  // Sem senha configurada o portão fica desativado (evita travar o
  // desenvolvimento local). A proteção real continua sendo o Supabase Auth + RLS.
  if (!SENHA) {
    if (import.meta.env.DEV) {
      console.warn('VITE_APP_ACCESS_PASSWORD não configurada — portão de acesso desativado.')
    }
    return <>{children}</>
  }

  if (liberado) return <>{children}</>

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (senha === SENHA) {
      try {
        sessionStorage.setItem(CHAVE_SESSAO, 'true')
      } catch {
        /* sessionStorage indisponível: segue liberado apenas nesta renderização */
      }
      setLiberado(true)
    } else {
      setErro(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Acesso restrito</CardTitle>
          <CardDescription>Digite a senha de acesso para entrar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="senha-acesso">Senha</Label>
              <div className="relative">
                <Input
                  id="senha-acesso"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoFocus
                  autoComplete="off"
                  value={senha}
                  placeholder="••••••••"
                  className="pr-10"
                  onChange={(e) => {
                    setSenha(e.target.value)
                    setErro(false)
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setMostrarSenha((m) => !m)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {erro ? <p className="text-xs text-destructive">Senha incorreta. Tente novamente.</p> : null}
            </div>
            <Button type="submit" className="w-full" disabled={!senha}>
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
