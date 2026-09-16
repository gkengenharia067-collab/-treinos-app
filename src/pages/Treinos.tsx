import { useEffect, useMemo, useState } from 'react'
import { Archive, ChevronDown, Dumbbell, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/auth'
import { DIVISAO_LABEL, METODO_LABEL, OBJETIVO_LABEL } from '@/lib/constants'
import {
  carregarCatalogo,
  carregarPreferencia,
  gerarTreino,
  listarTreinosCompletos,
  type CatalogoDisponivel,
  type TreinoDetalhado,
} from '@/lib/data'
import { fmtData } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { PreferenciaTreino, SessaoExercicio } from '@/lib/types'
import { cn } from '@/lib/utils'

export function Treinos() {
  const { usuario } = useAuth()
  const [carregando, setCarregando] = useState(true)
  const [treinos, setTreinos] = useState<TreinoDetalhado[]>([])
  const [pref, setPref] = useState<PreferenciaTreino | null>(null)
  const [catalogo, setCatalogo] = useState<CatalogoDisponivel | null>(null)
  const [gerando, setGerando] = useState(false)

  async function carregar() {
    if (!usuario) return
    const [t, p, c] = await Promise.all([
      listarTreinosCompletos(usuario.id),
      carregarPreferencia(usuario.id),
      carregarCatalogo(),
    ])
    setTreinos(t)
    setPref(p)
    setCatalogo(c)
  }

  useEffect(() => {
    setCarregando(true)
    void carregar().finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario])

  const ativo = useMemo(() => treinos.find((t) => t.status === 'ativo') ?? null, [treinos])
  const historico = useMemo(() => treinos.filter((t) => t.status === 'arquivado'), [treinos])

  async function regenerar() {
    if (!usuario || !pref || !catalogo) return
    setGerando(true)
    try {
      const proximaVersao = (treinos.reduce((max, t) => Math.max(max, t.versao), 0) || 0) + 1
      await gerarTreino({
        usuarioId: usuario.id,
        preferencia: {
          divisao: pref.divisao,
          objetivo: pref.objetivo,
          nivel: pref.nivel,
          equipamentos: pref.equipamentos,
          restricoes: pref.restricoes,
        },
        catalogo,
        versao: proximaVersao,
        nome: `Treino ${DIVISAO_LABEL[pref.divisao]} v${proximaVersao}`,
        arquivar: ativo?.id ?? null,
      })
      toast.success('Novo treino gerado!')
      await carregar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao gerar treino')
    } finally {
      setGerando(false)
    }
  }

  async function arquivar(id: string) {
    if (!supabase) return
    const { error } = await supabase
      .from('treino')
      .update({ status: 'arquivado', arquivado_em: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      toast.error('Não foi possível arquivar.')
      return
    }
    toast.success('Treino arquivado.')
    await carregar()
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Meus treinos</h1>
          <p className="text-sm text-muted-foreground">
            {pref
              ? `${DIVISAO_LABEL[pref.divisao]} · ${OBJETIVO_LABEL[pref.objetivo]} · método ${
                  METODO_LABEL[pref.nivel === 'iniciante' ? 'linear' : pref.nivel === 'intermediario' ? 'double_progression' : 'rpe']
                }`
              : 'Sem preferências definidas'}
          </p>
        </div>
        <div className="flex gap-2">
          {pref ? (
            <Button onClick={() => void regenerar()} disabled={gerando}>
              {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {ativo ? 'Regenerar treino' : 'Gerar treino'}
            </Button>
          ) : (
            <Button asChild>
              <Link to="/cadastro">
                <Sparkles className="h-4 w-4" /> Configurar preferências
              </Link>
            </Button>
          )}
        </div>
      </div>

      {ativo ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                {ativo.nome}
              </CardTitle>
              <CardDescription>
                Ativo · v{ativo.versao} · criado em {fmtData(ativo.criado_em)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="success">Ativo</Badge>
              <Button variant="outline" size="sm" onClick={() => void arquivar(ativo.id)}>
                <Archive className="h-4 w-4" /> Arquivar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ativo.sessoes.map((s) => (
              <SessaoTreinoBloco key={s.id} sessao={s} />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Dumbbell className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Você ainda não possui um treino ativo. Gere um treino personalizado com base nas suas preferências.
            </p>
            {pref ? (
              <Button onClick={() => void regenerar()} disabled={gerando}>
                {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Gerar treino
              </Button>
            ) : (
              <Button asChild>
                <Link to="/cadastro">Configurar preferências</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {historico.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico</CardTitle>
            <CardDescription>Versões anteriores arquivadas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {historico.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {DIVISAO_LABEL[t.divisao]} · v{t.versao} · arquivado em {fmtData(t.arquivado_em)}
                  </p>
                </div>
                <Badge variant="secondary">Arquivado</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function SessaoTreinoBloco({
  sessao,
}: {
  sessao: TreinoDetalhado['sessoes'][number]
}) {
  const [aberto, setAberto] = useState(false)
  const aquecimento = sessao.exercicios.filter((e) => e.tipo !== 'forca')
  const principais = sessao.exercicios.filter((e) => e.tipo === 'forca')

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            {sessao.letra}
          </div>
          <div>
            <p className="font-medium">{sessao.nome}</p>
            <p className="text-xs text-muted-foreground">
              {principais.length} exercícios · {aquecimento.length} de aquecimento
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link to={`/treino/${sessao.id}`}>Treinar</Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setAberto((a) => !a)} aria-label="Detalhes">
            <ChevronDown className={cn('h-4 w-4 transition-transform', aberto && 'rotate-180')} />
          </Button>
        </div>
      </div>

      {aberto ? (
        <>
          <Separator />
          <div className="space-y-4 p-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Aquecimento · 5–8 min
              </p>
              <ul className="space-y-1.5">
                {aquecimento.map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-sm">
                    <span>{e.exercicio?.nome ?? `Exercício #${e.exercicio_id}`}</span>
                    <span className="text-xs text-muted-foreground">{descricao(e)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exercícios</p>
              <ul className="space-y-2">
                {principais.map((e) => (
                  <li key={e.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{e.exercicio?.nome ?? `Exercício #${e.exercicio_id}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {descricao(e)} · descanso {e.tempo_descanso ?? 0}s
                          {e.metodo_progressao ? ` · ${METODO_LABEL[e.metodo_progressao]}` : ''}
                        </p>
                      </div>
                      {e.obs ? <Badge variant="warning">Cautela</Badge> : null}
                    </div>
                    {e.obs ? <p className="mt-2 text-xs text-amber-600">{e.obs}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function descricao(e: SessaoExercicio): string {
  if (e.reps) return e.reps
  if (e.reps_min != null && e.reps_max != null) return `${e.reps_min}–${e.reps_max} reps`
  return ''
}