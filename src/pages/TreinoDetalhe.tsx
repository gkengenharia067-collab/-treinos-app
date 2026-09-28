import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Dumbbell,
  Flame,
  Loader2,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Save,
  TrendingUp,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/auth'
import { METODO_LABEL } from '@/lib/constants'
import {
  carregarCatalogo,
  carregarPreferencia,
  carregarSessaoCompleta,
  inserirExecucao,
  historicoPorExercicios,
  listarExerciciosDaSessao,
  trocarExercicio,
  type CatalogoDisponivel,
  type SessaoPublica,
} from '@/lib/data'
import { fmtData } from '@/lib/format'
import { alternativasExercicio } from '@/lib/generator'
import { sugerirProgressao, type Prescricao, type UltimaExecucao } from '@/lib/progression'
import type { Execucao, Exercicio, PreferenciaTreino, SessaoExercicio } from '@/lib/types'
import { cn } from '@/lib/utils'

export function TreinoDetalhe() {
  const { sessaoId } = useParams<{ sessaoId: string }>()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [sessao, setSessao] = useState<SessaoPublica | null>(null)
  const [historico, setHistorico] = useState<Execucao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [catalogo, setCatalogo] = useState<CatalogoDisponivel | null>(null)
  const [preferencia, setPreferencia] = useState<PreferenciaTreino | null>(null)
  const [idsJaUsados, setIdsJaUsados] = useState<number[]>([])

  async function carregar() {
    if (!sessaoId) return
    const [s, linhas] = await Promise.all([
      carregarSessaoCompleta(sessaoId),
      listarExerciciosDaSessao(sessaoId),
    ])
    setSessao(s)
    setIdsJaUsados(linhas.map((l) => l.exercicio_id).filter((id): id is number => id != null))
    if (s) {
      const ids = s.exercicios.filter((e) => e.tipo === 'forca').map((e) => e.id)
      setHistorico(await historicoPorExercicios(ids))
    }
  }

  useEffect(() => {
    setCarregando(true)
    void carregar().finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessaoId])

  useEffect(() => {
    if (!usuario) return
    void Promise.all([carregarCatalogo(), carregarPreferencia(usuario.id)]).then(([c, p]) => {
      setCatalogo(c)
      setPreferencia(p)
    })
  }, [usuario])

  function alternativasPara(e: SessaoExercicio & { exercicio: Exercicio | null }): Exercicio[] {
    if (!catalogo || !preferencia || !sessao || !e.exercicio) return []
    return alternativasExercicio(
      e.exercicio_id,
      e.tipo,
      e.exercicio.grupo_muscular,
      catalogo.catalogo,
      catalogo.mapaContra,
      preferencia.restricoes ?? [],
      preferencia.equipamentos ?? [],
      idsJaUsados,
    )
  }

  async function trocar(atual: SessaoExercicio, novo: Exercicio) {
    try {
      await trocarExercicio(atual, novo.id)
      toast.success(`Exercício trocado por ${novo.nome}.`)
      await carregar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao trocar exercício')
    }
  }

  const porExercicio = useMemo(() => {
    const map = new Map<string, Execucao[]>()
    for (const e of historico) {
      const arr = map.get(e.sessao_exercicio_id) ?? []
      arr.push(e)
      map.set(e.sessao_exercicio_id, arr)
    }
    return map
  }, [historico])

  const principais = sessao?.exercicios.filter((e) => e.tipo === 'forca') ?? []
  const aquecimento = sessao?.exercicios.filter((e) => e.tipo !== 'forca') ?? []

  const feitosHoje = principais.filter((e) => {
    const hoje = new Date().toDateString()
    return (porExercicio.get(e.id) ?? []).some((x) => x.concluido && new Date(x.data).toDateString() === hoje)
  }).length

  const progresso = principais.length ? (feitosHoje / principais.length) * 100 : 0

  if (carregando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Dumbbell className="h-6 w-6 animate-pulse text-muted-foreground" />
      </div>
    )
  }

  if (!sessao) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Sessão não encontrada.
          <div className="mt-3">
            <Button asChild variant="outline">
              <Link to="/treinos">Voltar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/treinos')} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {sessao.letra} · {sessao.nome}
          </h1>
          <p className="text-sm text-muted-foreground">Execução ao vivo</p>
        </div>
        <Cronometro />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {feitosHoje} de {principais.length} exercícios concluídos hoje
          </span>
          <span className="tabular-nums text-muted-foreground">{Math.round(progresso)}%</span>
        </div>
        <Progress value={progresso} />
      </div>

      <AquecimentoCard exercicios={aquecimento} />

      <div className="space-y-4">
        {principais.map((e) => (
          <ExecucaoCard
            key={e.id}
            exercicio={e}
            historico={porExercicio.get(e.id) ?? []}
            usuarioId={usuario!.id}
            alternativas={() => alternativasPara(e)}
            onTrocar={(novo) => trocar(e, novo)}
            onSalvo={() => void carregar()}
          />
        ))}
      </div>
    </div>
  )
}

function Cronometro() {
  const [segundos, setSegundos] = useState(0)
  const [rodando, setRodando] = useState(false)
  const ref = useRef<number | null>(null)

  useEffect(() => {
    if (rodando) {
      ref.current = window.setInterval(() => setSegundos((s) => s + 1), 1000)
    } else if (ref.current) {
      window.clearInterval(ref.current)
    }
    return () => {
      if (ref.current) window.clearInterval(ref.current)
    }
  }, [rodando])

  const mm = String(Math.floor(segundos / 60)).padStart(2, '0')
  const ss = String(segundos % 60).padStart(2, '0')

  return (
    <div className="flex items-center gap-1 rounded-lg border px-2 py-1">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="w-12 text-center text-sm font-medium tabular-nums">
        {mm}:{ss}
      </span>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRodando((r) => !r)}>
        {rodando ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => {
          setRodando(false)
          setSegundos(0)
        }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function AquecimentoCard({ exercicios }: { exercicios: SessaoPublica['exercicios'] }) {
  const [aberto, setAberto] = useState(true)
  const [feitos, setFeitos] = useState<Set<string>>(new Set())

  return (
    <Card>
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between space-y-0"
        onClick={() => setAberto((a) => !a)}
      >
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-4 w-4 text-amber-500" /> Aquecimento · 5–8 min
        </CardTitle>
        <ChevronDown className={cn('h-4 w-4 transition-transform', aberto && 'rotate-180')} />
      </CardHeader>
      {aberto ? (
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {exercicios.map((e) => {
            const done = feitos.has(e.id)
            return (
              <button
                key={e.id}
                type="button"
                onClick={() =>
                  setFeitos((prev) => {
                    const next = new Set(prev)
                    if (next.has(e.id)) next.delete(e.id)
                    else next.add(e.id)
                    return next
                  })
                }
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
                  done ? 'border-emerald-500/40 bg-emerald-500/5' : 'hover:bg-accent',
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <p className={cn('font-medium', done && 'line-through')}>{e.exercicio?.nome}</p>
                  <p className="text-xs text-muted-foreground">{e.reps ?? ''}</p>
                </div>
              </button>
            )
          })}
        </CardContent>
      ) : null}
    </Card>
  )
}

function ExecucaoCard({
  exercicio,
  historico,
  usuarioId,
  alternativas,
  onTrocar,
  onSalvo,
}: {
  exercicio: SessaoExercicio & { exercicio: Exercicio | null }
  historico: Execucao[]
  usuarioId: string
  alternativas: () => Exercicio[]
  onTrocar: (novo: Exercicio) => void | Promise<void>
  onSalvo: () => void
}) {
  const seriesPrescritas = exercicio.series ?? 3
  const [seriesFeitas, setSeriesFeitas] = useState(0)
  const [carga, setCarga] = useState('')
  const [reps, setReps] = useState('')
  const [rpe, setRpe] = useState('')
  const [obs, setObs] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [troca, setTroca] = useState<{ lista: Exercicio[]; indice: number } | null>(null)
  const [trocando, setTrocando] = useState(false)

  const temInicio = exercicio.exercicio?.imagem_url_inicio ?? null
  const temFim = exercicio.exercicio?.imagem_url_fim ?? null

  const ultima = historico.length ? historico[historico.length - 1] : null
  const hoje = new Date().toDateString()
  const feitoHoje = historico.some((h) => h.concluido && new Date(h.data).toDateString() === hoje)

  useEffect(() => {
    if (ultima) {
      setCarga(ultima.carga_usada != null ? String(ultima.carga_usada) : '')
      setReps(ultima.reps_feitas != null ? String(ultima.reps_feitas) : '')
      setRpe(ultima.rpe != null ? String(ultima.rpe) : '')
    }
  }, [ultima?.id])

  const prescricao: Prescricao | null =
    exercicio.reps_min != null && exercicio.reps_max != null
      ? {
          series: seriesPrescritas,
          repsMin: exercicio.reps_min,
          repsMax: exercicio.reps_max,
          metodo: exercicio.metodo_progressao ?? 'linear',
          rpeAlvo: exercicio.rpe_alvo,
        }
      : null

  const ultimaResumo: UltimaExecucao | null = ultima
    ? {
        series_feitas: ultima.series_feitas,
        reps_feitas: ultima.reps_feitas,
        carga_usada: ultima.carga_usada,
        rpe: ultima.rpe,
        concluido: ultima.concluido,
      }
    : null

  const sugestao = prescricao && !feitoHoje ? sugerirProgressao(prescricao, ultimaResumo) : null

  async function salvar() {
    setSalvando(true)
    try {
      await inserirExecucao(usuarioId, {
        sessao_exercicio_id: exercicio.id,
        data: new Date().toISOString(),
        series_feitas: seriesFeitas,
        reps_feitas: reps ? Number(reps) : null,
        carga_usada: carga ? Number(carga) : null,
        rpe: rpe ? Number(rpe) : null,
        obs: obs || null,
        concluido: seriesFeitas >= seriesPrescritas,
      })
      toast.success('Execução registrada!')
      setSeriesFeitas(0)
      setObs('')
      onSalvo()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao registrar')
    } finally {
      setSalvando(false)
    }
  }

  function iniciarTroca() {
    const lista = alternativas()
    if (!lista.length) {
      toast.info('Nenhuma alternativa compatível com seus equipamentos e restrições.')
      return
    }
    setTroca({ lista, indice: 0 })
  }

  async function confirmarTroca() {
    if (!troca) return
    setTrocando(true)
    try {
      await onTrocar(troca.lista[troca.indice])
      setTroca(null)
    } finally {
      setTrocando(false)
    }
  }

  return (
    <Card className={cn(feitoHoje && 'border-emerald-500/40')}>
      {temInicio || temFim ? (
        <div className={cn('grid gap-2 p-4 pb-0', temInicio && temFim ? 'sm:grid-cols-2' : '')}>
          {temInicio ? (
            <div className="relative overflow-hidden rounded-lg border bg-muted/50">
              <img
                src={temInicio}
                alt={`${exercicio.exercicio?.nome ?? 'Exercício'}: posição inicial`}
                loading="lazy"
                className="h-40 w-full object-cover sm:h-48"
              />
              <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Início
              </span>
            </div>
          ) : null}
          {temFim ? (
            <div className="relative overflow-hidden rounded-lg border bg-muted/50">
              <img
                src={temFim}
                alt={`${exercicio.exercicio?.nome ?? 'Exercício'}: posição final`}
                loading="lazy"
                className="h-40 w-full object-cover sm:h-48"
              />
              <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Fim
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <Dumbbell className="h-4 w-4 text-primary" />
            {exercicio.exercicio?.nome}
            {feitoHoje ? (
              <Badge variant="success">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Feito hoje
              </Badge>
            ) : null}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {seriesPrescritas} × {exercicio.reps_min}–{exercicio.reps_max} reps · descanso {exercicio.tempo_descanso ?? 0}s
            {exercicio.metodo_progressao ? ` · ${METODO_LABEL[exercicio.metodo_progressao]}` : ''}
            {exercicio.rpe_alvo ? ` · RPE alvo ${exercicio.rpe_alvo}` : ''}
          </p>
          {exercicio.obs ? <p className="mt-1 text-xs text-amber-600">{exercicio.obs}</p> : null}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setAberto((a) => !a)} aria-label="Expandir">
          <ChevronDown className={cn('h-4 w-4 transition-transform', aberto && 'rotate-180')} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {ultima ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-muted/50 p-3 text-xs">
            <span className="font-medium text-muted-foreground">Último registro:</span>
            <span>
              {ultima.carga_usada != null ? `${ultima.carga_usada} kg` : '—'} × {ultima.reps_feitas ?? '—'} reps
            </span>
            {ultima.rpe != null ? <span>RPE {ultima.rpe}</span> : null}
            <span className="text-muted-foreground">{fmtData(ultima.data)}</span>
          </div>
        ) : null}

        {sugestao ? (
          <div
            className={cn(
              'flex items-start gap-2 rounded-lg border p-3 text-xs',
              sugestao.acao === 'subir' && 'border-emerald-500/40 bg-emerald-500/5',
              sugestao.acao === 'reduzir' && 'border-amber-500/40 bg-amber-500/5',
            )}
          >
            <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div>
              <span className="font-medium">
                {sugestao.acao === 'subir'
                  ? 'Sugestão: subir carga'
                  : sugestao.acao === 'reduzir'
                    ? 'Sugestão: reduzir carga'
                    : sugestao.acao === 'iniciar'
                      ? 'Primeira vez'
                      : 'Sugestão: manter carga'}
                {sugestao.proximaCarga != null ? ` → ${sugestao.proximaCarga} kg` : ''}
              </span>
              <p className="mt-0.5 text-muted-foreground">{sugestao.motivo}</p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: Math.max(seriesPrescritas, 5) }).map((_, i) => {
            const ativo = i < seriesFeitas
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSeriesFeitas(ativo && i === seriesFeitas - 1 ? i : i + 1)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                  ativo ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
                )}
                aria-label={`Série ${i + 1}`}
              >
                {i + 1}
              </button>
            )
          })}
          <span className="self-center text-xs text-muted-foreground">séries feitas</span>
        </div>

        {aberto ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor={`carga-${exercicio.id}`}>Carga (kg)</Label>
              <Input
                id={`carga-${exercicio.id}`}
                type="number"
                inputMode="decimal"
                step="0.5"
                value={carga}
                onChange={(e) => setCarga(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`reps-${exercicio.id}`}>Reps</Label>
              <Input
                id={`reps-${exercicio.id}`}
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`rpe-${exercicio.id}`}>RPE (opcional)</Label>
              <Input
                id={`rpe-${exercicio.id}`}
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor={`obs-${exercicio.id}`}>Observações</Label>
              <Textarea
                id={`obs-${exercicio.id}`}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Sensação, ajustes de técnica…"
              />
            </div>
          </div>
        ) : null}

        {troca ? (
          <div className="rounded-lg border border-dashed p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Trocar exercício
            </p>
            <p className="mt-1 text-sm font-medium">{troca.lista[troca.indice].nome}</p>
            <p className="text-xs text-muted-foreground">
              Alternativa {troca.indice + 1} de {troca.lista.length} · mesmo grupo muscular e equipamentos
              compatíveis
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void confirmarTroca()} disabled={trocando}>
                {trocando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
                Trocar por este
              </Button>
              {troca.lista.length > 1 ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={trocando}
                  onClick={() =>
                    setTroca((t) => (t ? { ...t, indice: (t.indice + 1) % t.lista.length } : t))
                  }
                >
                  Não serve, mostra outra
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" disabled={trocando} onClick={() => setTroca(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}

        <Separator />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setAberto((a) => !a)}>
              {aberto ? 'Ocultar' : 'Preencher carga/reps/RPE'}
            </Button>
            <Button variant="ghost" size="sm" onClick={iniciarTroca} disabled={trocando}>
              <Repeat className="h-3.5 w-3.5" /> Trocar exercício
            </Button>
          </div>
          <Button onClick={() => void salvar()} disabled={salvando || seriesFeitas === 0}>
            <Save className="h-4 w-4" /> Salvar execução
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}