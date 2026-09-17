import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Check, KeyRound, Loader2, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/auth'
import {
  DIAS_DISPONIVEIS,
  DIVISAO_LABEL,
  EQUIPAMENTOS,
  NIVEIS,
  OBJETIVOS,
  SPLIT_POR_DIAS,
  divisaoPorDias,
} from '@/lib/constants'
import {
  carregarCatalogo,
  carregarPreferencia,
  gerarTreino,
  listarTreinosCompletos,
  salvarPreferencia,
} from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { Nivel, Objetivo, PreferenciaTreino, Restricao, Sexo } from '@/lib/types'
import { cn } from '@/lib/utils'

export function Perfil() {
  const { usuario, perfil, atualizarPerfil, refrescarPerfil } = useAuth()
  const [pref, setPref] = useState<PreferenciaTreino | null>(null)
  const [restricoes, setRestricoes] = useState<Restricao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvandoPessoal, setSalvandoPessoal] = useState(false)
  const [salvandoPref, setSalvandoPref] = useState(false)
  const [enviandoSenha, setEnviandoSenha] = useState(false)
  const [subindoAvatar, setSubindoAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [pessoal, setPessoal] = useState({
    nome: '',
    data_nasc: '',
    sexo: '' as Sexo | '',
    altura_cm: '',
  })

  const [form, setForm] = useState({
    objetivo: '' as Objetivo | '',
    nivel: '' as Nivel | '',
    dias_semana: [] as number[],
    equipamentos: [] as string[],
    restricoes: [] as number[],
  })

  useEffect(() => {
    if (!usuario) return
    void Promise.all([carregarPreferencia(usuario.id), carregarCatalogo()]).then(([p, c]) => {
      setPref(p)
      setRestricoes(c.restricoes)
      if (p) {
        setForm({
          objetivo: p.objetivo,
          nivel: p.nivel,
          dias_semana: p.dias_semana ?? [],
          equipamentos: p.equipamentos ?? [],
          restricoes: p.restricoes ?? [],
        })
      }
      setCarregando(false)
    })
  }, [usuario])

  useEffect(() => {
    if (perfil) {
      setPessoal({
        nome: perfil.nome ?? '',
        data_nasc: perfil.data_nasc ?? '',
        sexo: perfil.sexo ?? '',
        altura_cm: perfil.altura_cm != null ? String(perfil.altura_cm) : '',
      })
    }
  }, [perfil])

  const inicial = useMemo(() => (perfil?.nome ?? '?').slice(0, 2).toUpperCase(), [perfil])
  const divisaoAtual = useMemo(() => divisaoPorDias(form.dias_semana), [form.dias_semana])

  function alternarNumero(lista: number[], v: number): number[] {
    return lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]
  }
  function alternarTexto(lista: string[], v: string): string[] {
    return lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]
  }

  async function salvarPessoal() {
    setSalvandoPessoal(true)
    try {
      await atualizarPerfil({
        nome: pessoal.nome.trim(),
        data_nasc: pessoal.data_nasc || null,
        sexo: (pessoal.sexo || null) as Sexo | null,
        altura_cm: pessoal.altura_cm ? Number(pessoal.altura_cm) : null,
      })
      toast.success('Dados atualizados!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao salvar')
    } finally {
      setSalvandoPessoal(false)
    }
  }

  async function salvarPreferencias(regenerar: boolean) {
    const divisao = divisaoPorDias(form.dias_semana)
    if (!usuario || !divisao || !form.objetivo || !form.nivel) return
    setSalvandoPref(true)
    try {
      await salvarPreferencia(usuario.id, {
        divisao,
        objetivo: form.objetivo,
        nivel: form.nivel,
        dias_semana: form.dias_semana,
        equipamentos: form.equipamentos,
        restricoes: form.restricoes,
      })
      if (regenerar) {
        const [catalogo, treinos] = await Promise.all([carregarCatalogo(), listarTreinosCompletos(usuario.id)])
        const ativo = treinos.find((t) => t.status === 'ativo') ?? null
        const versao = (treinos.reduce((m, t) => Math.max(m, t.versao), 0) || 0) + 1
        await gerarTreino({
          usuarioId: usuario.id,
          preferencia: {
            divisao,
            dias_semana: form.dias_semana,
            objetivo: form.objetivo,
            nivel: form.nivel,
            equipamentos: form.equipamentos,
            restricoes: form.restricoes,
          },
          catalogo,
          versao,
          nome: `Treino ${DIVISAO_LABEL[divisao]} v${versao}`,
          arquivar: ativo?.id ?? null,
        })
        toast.success('Preferências salvas e treino regenerado!')
      } else {
        toast.success('Preferências salvas!')
      }
      const p = await carregarPreferencia(usuario.id)
      setPref(p)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao salvar preferências')
    } finally {
      setSalvandoPref(false)
    }
  }

  async function subirAvatar(arquivo: File) {
    if (!usuario || !supabase) return
    setSubindoAvatar(true)
    try {
      const ext = arquivo.name.split('.').pop() ?? 'png'
      const path = `${usuario.id}/avatar.${ext}`
      const { error } = await supabase.storage.from('avatares').upload(path, arquivo, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('avatares').getPublicUrl(path)
      await atualizarPerfil({ avatar_url: data.publicUrl })
      await refrescarPerfil()
      toast.success('Avatar atualizado!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha no upload')
    } finally {
      setSubindoAvatar(false)
    }
  }

  async function enviarResetSenha() {
    if (!perfil?.email || !supabase) return
    setEnviandoSenha(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(perfil.email, {
        redirectTo: window.location.origin + '/login',
      })
      if (error) throw error
      toast.success('Enviamos um link de redefinição para seu e-mail.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao enviar e-mail')
    } finally {
      setEnviandoSenha(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conta</CardTitle>
          <CardDescription>Foto e dados de acesso.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Avatar className="h-16 w-16">
            {perfil?.avatar_url ? <AvatarImage src={perfil.avatar_url} /> : null}
            <AvatarFallback>{inicial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={subindoAvatar}>
              {subindoAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Trocar foto
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void enviarResetSenha()} disabled={enviandoSenha}>
              {enviandoSenha ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Alterar senha
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void subirAvatar(f)
              }}
            />
          </div>
          <div className="ml-auto text-right text-sm">
            <p className="font-medium">{perfil?.email}</p>
            <Badge variant="success" className="mt-1">
              <ShieldCheck className="mr-1 h-3 w-3" /> Plano pago
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados pessoais</CardTitle>
          <CardDescription>Usados nos cálculos corporais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={pessoal.nome} onChange={(e) => setPessoal((p) => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nascimento">Data de nascimento</Label>
              <Input
                id="nascimento"
                type="date"
                value={pessoal.data_nasc}
                onChange={(e) => setPessoal((p) => ({ ...p, data_nasc: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sexo</Label>
              <div className="flex gap-2">
                {(['masculino', 'feminino'] as Sexo[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPessoal((p) => ({ ...p, sexo: s }))}
                    className={cn(
                      'flex-1 rounded-lg border p-2.5 text-sm font-medium capitalize transition-colors',
                      pessoal.sexo === s ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="altura">Altura (cm)</Label>
              <Input
                id="altura"
                type="number"
                step="0.1"
                value={pessoal.altura_cm}
                onChange={(e) => setPessoal((p) => ({ ...p, altura_cm: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => void salvarPessoal()} disabled={salvandoPessoal}>
              {salvandoPessoal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar dados
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" /> Preferências de treino
          </CardTitle>
          <CardDescription>Alterar preferências permite regenerar um treino novo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Secao titulo="Objetivo">
            <Grade
              opcoes={Object.entries(OBJETIVOS).map(([v, o]) => ({ valor: v, titulo: o.label, descricao: o.desc }))}
              selecionado={form.objetivo}
              onSelect={(v) => setForm((f) => ({ ...f, objetivo: v as Objetivo }))}
            />
          </Secao>
          <Secao titulo="Nível (define a progressão)">
            <Grade
              opcoes={Object.entries(NIVEIS).map(([v, n]) => ({ valor: v, titulo: n.label, descricao: n.desc }))}
              selecionado={form.nivel}
              onSelect={(v) => setForm((f) => ({ ...f, nivel: v as Nivel }))}
            />
          </Secao>
          <Secao titulo="Dias da semana (definem a divisão)">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DIAS_DISPONIVEIS.map((dia) => {
                const ativo = form.dias_semana.includes(dia.valor)
                return (
                  <button
                    key={dia.valor}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, dias_semana: alternarNumero(f.dias_semana, dia.valor) }))}
                    className={cn(
                      'rounded-lg border p-2.5 text-sm transition-colors',
                      ativo ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent',
                    )}
                  >
                    {dia.rotulo}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 rounded-lg border bg-muted/40 p-3 text-sm">
              {divisaoAtual ? (
                <>
                  <p className="font-medium">
                    Divisão {DIVISAO_LABEL[divisaoAtual]} · {form.dias_semana.length} dia(s)/semana
                  </p>
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {SPLIT_POR_DIAS[form.dias_semana.length].sessoes.map((s) => (
                      <li key={s.letra}>
                        <span className="font-medium text-foreground">{s.letra}</span>: {s.nome}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-muted-foreground">Selecione pelo menos 1 dia para definir a divisão.</p>
              )}
            </div>
          </Secao>
          <Secao titulo="Equipamentos">
            <div className="grid gap-2 sm:grid-cols-2">
              {EQUIPAMENTOS.map((eq) => (
                <label
                  key={eq.valor}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
                    form.equipamentos.includes(eq.valor) ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                  )}
                >
                  <Checkbox
                    checked={form.equipamentos.includes(eq.valor)}
                    onCheckedChange={() =>
                      setForm((f) => ({ ...f, equipamentos: alternarTexto(f.equipamentos, eq.valor) }))
                    }
                  />
                  {eq.label}
                </label>
              ))}
            </div>
          </Secao>
          <Secao titulo="Restrições">
            <div className="grid gap-2 sm:grid-cols-2">
              {restricoes.map((r) => (
                <label
                  key={r.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm capitalize transition-colors',
                    form.restricoes.includes(r.id) ? 'border-amber-500 bg-amber-500/10' : 'hover:bg-accent',
                  )}
                >
                  <Checkbox
                    checked={form.restricoes.includes(r.id)}
                    onCheckedChange={() => setForm((f) => ({ ...f, restricoes: alternarNumero(f.restricoes, r.id) }))}
                  />
                  {r.nome}
                </label>
              ))}
            </div>
          </Secao>

          <Separator />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => void salvarPreferencias(false)} disabled={salvandoPref}>
              {salvandoPref ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar preferências
            </Button>
            <Button onClick={() => void salvarPreferencias(true)} disabled={salvandoPref}>
              <RefreshCw className="h-4 w-4" /> Salvar e regenerar treino
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plano</CardTitle>
          <CardDescription>Você tem acesso completo a todos os recursos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Pago</p>
              <p className="text-xs text-muted-foreground">
                Regeneração de treino, filtro de contraindicação, progressões linear/double/RPE, %G por US Navy e
                Pollock 3, dashboard completo.
              </p>
            </div>
            <Badge variant="success">Ativo</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Novos níveis de assinatura (básico/premium) serão definidos com base no uso real. Nenhum recurso é bloqueado
            nesta fase.
          </p>
          {pref ? null : (
            <p className="text-xs text-amber-600">
              Você ainda não definiu suas preferências de treino.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{titulo}</p>
      {children}
    </div>
  )
}

function Grade({
  opcoes,
  selecionado,
  onSelect,
}: {
  opcoes: { valor: string; titulo: string; descricao: string }[]
  selecionado: string
  onSelect: (valor: string) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {opcoes.map((o) => {
        const ativo = selecionado === o.valor
        return (
          <button
            key={o.valor}
            type="button"
            onClick={() => onSelect(o.valor)}
            className={cn(
              'rounded-lg border p-3 text-left text-sm transition-colors',
              ativo ? 'border-primary bg-primary/5' : 'hover:bg-accent',
            )}
          >
            <p className="font-medium">{o.titulo}</p>
            <p className="text-xs text-muted-foreground">{o.descricao}</p>
          </button>
        )
      })}
    </div>
  )
}