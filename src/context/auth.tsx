import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createSupabaseError, isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Usuario } from '@/lib/types'

interface AuthContextValue {
  usuario: { id: string; email?: string } | null
  perfil: Usuario | null
  carregando: boolean
  configurado: boolean
  entrar: (email: string, senha: string) => Promise<void>
  registrar: (email: string, senha: string, nome: string) => Promise<boolean>
  sair: () => Promise<void>
  atualizarPerfil: (campos: Partial<Usuario>) => Promise<void>
  refrescarPerfil: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<{ id: string; email?: string } | null>(null)
  const [perfil, setPerfil] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  const refrescarPerfil = useCallback(async (uid?: string) => {
    if (!supabase) return
    let id = uid
    if (!id) {
      const { data } = await supabase.auth.getUser()
      id = data.user?.id
    }
    if (!id) return
    const { data } = await supabase
      .from('usuario')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (data) setPerfil(data as Usuario)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setCarregando(false)
      return
    }
    let ativo = true
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!ativo) return
        const u = data.session?.user ?? null
        setUsuario(u ? { id: u.id, email: u.email } : null)
        if (u) await refrescarPerfil(u.id)
        setCarregando(false)
      })
      .catch(() => setCarregando(false))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUsuario(u ? { id: u.id, email: u.email } : null)
      if (u) {
        void refrescarPerfil(u.id)
      } else {
        setPerfil(null)
      }
      setCarregando(false)
    })
    return () => {
      ativo = false
      sub.subscription.unsubscribe()
    }
  }, [refrescarPerfil])

  const entrar = useCallback(async (email: string, senha: string) => {
    if (!supabase) throw new Error('Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw new Error(createSupabaseError(error))
  }, [])

  const registrar = useCallback(async (email: string, senha: string, nome: string) => {
    if (!supabase) throw new Error('Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
        emailRedirectTo: window.location.origin + '/login',
      },
    })
    if (error) throw new Error(createSupabaseError(error))
    return Boolean(data.session)
  }, [])

  const sair = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUsuario(null)
    setPerfil(null)
  }, [])

  const atualizarPerfil = useCallback(
    async (campos: Partial<Usuario>) => {
      if (!supabase) return
      let id = usuario?.id
      if (!id) {
        const { data } = await supabase.auth.getUser()
        id = data.user?.id
      }
      if (!id) return
      const { error } = await supabase.from('usuario').update(campos).eq('id', id)
      if (error) throw new Error(createSupabaseError(error))
      setPerfil((prev) => (prev ? { ...prev, ...campos } : prev))
    },
    [usuario],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      perfil,
      carregando,
      configurado: isSupabaseConfigured,
      entrar,
      registrar,
      sair,
      atualizarPerfil,
      refrescarPerfil,
    }),
    [usuario, perfil, carregando, entrar, registrar, sair, atualizarPerfil, refrescarPerfil],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}