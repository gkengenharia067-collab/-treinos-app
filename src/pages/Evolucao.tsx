import { useEffect, useMemo, useState } from 'react'
import { Award, Loader2, Plus, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MetricCard } from '@/components/MetricCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/context/auth'
import {
  listarDobras,
  listarExecucoesDetalhadas,
  listarMedidas,
  listarTreinosCompletos,
  type ExecucaoDetalhada,
  type TreinoDetalhado,
} from '@/lib/data'
import { fmtDataCurta, fmtNum } from '@/lib/format'
import { calcularMetricas } from '@/lib/metricas'
import type { DobraCutanea, Medida } from '@/lib/types'

const PERIMETROS: { chave: string; label: string; valor: (m: Medida) => number | null }[] = [
  { chave: 'pescoco', label: 'Pescoço', valor: (m) => m.pescoco ?? null },
  { chave: 'cintura', label: 'Cintura', valor: (m) => m.cintura ?? null },
  { chave: 'abdomen', label: 'Abdômen', valor: (m) => m.abdomen ?? null },
  { chave: 'quadril', label: 'Quadril', valor: (m) => m.quadril ?? null },
  { chave: 'coxa', label: 'Coxa (média)', valor: (m) => mediaLados(m.coxa_d, m.coxa_e) },
  { chave: 'braco', label: 'Braço (média)', valor: (m) => mediaLados(m.braco_d, m.braco_e) },
  { chave: 'panturrilha', label: 'Panturrilha (média)', valor: (m) => mediaLados(m.panturrilha_d, m.panturrilha_e) },
]

function mediaLados(a?: number | null, b?: number | null): number | null {
  const valores = [a, b].filter((v): v is number => v != null)
  if (!valores.length) return null
  return valores.reduce((s, v) => s + v, 0) / valores.length
}

export function Evolucao() {
  const { usuario, perfil } = useAuth()
  const [carregando, setCarregando] = useState(true)
  const [medidas, setMedidas] = useState<Medida[]>([])
  const [dobras, setDobras] = useState<DobraCutanea[]>([])
  const [execucoes, setExecucoes] = useState<ExecucaoDetalhada[]>([])
  const [treinos, setTreinos] = useState<TreinoDetalhado[]>([])

  useEffect(() => {
    if (!usuario) return
    let ativo = true
    void Promise.all([
      listarMedidas(usuario.id),
      listarDobras(usuario.id),
      listarExecucoesDetalhadas(usuario.id),
      listarTreinosCompletos(usuario.id),
    ])
      .then(([m, d, e, t]) => {
        if (!ativo) return
        setMedidas(m)
        setDobras(d)
        setExecucoes(e)
        setTreinos(t)
      })
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [usuario])

  const medidasAsc = useMemo(() => [...medidas].reverse(), [medidas])

  function dobraDaMedida(m: Medida): DobraCutanea | null {
    const dia = new Date(m.data).toDateString()
    return dobras.find((d) => new Date(d.data).toDateString() === dia) ?? null
  }

  const atual = useMemo(
    () => calcularMetricas(medidas[0] ?? null, dobras[0] ?? null, perfil),
    [medidas, dobras, perfil],
  )
  const inicial = useMemo(
    () =>
      calcularMetricas(
        medidasAsc[0] ?? null,
        medidasAsc[0] ? dobraDaMedida(medidasAsc[0]) : null,
        perfil,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [medidasAsc, dobras, perfil],
  )

  const balanca = useMemo(
    () =>
      medidas.find(
        (m) =>
          m.gordura_balanca != null ||
          m.massa_magra_balanca != null ||
          m.agua_corporal != null ||
          m.massa_ossea != null,
      ),
    [medidas],
  )
  const balancaMet = useMemo(
    () => (balanca ? calcularMetricas(balanca, dobraDaMedida(balanca), perfil) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [balanca, dobras, perfil],
  )

  const perimetros = useMemo(() => {
    const linhas = PERIMETROS.map(({ chave, label, valor }) => {
      const valores = medidasAsc
        .map((m) => ({ v: valor(m) }))
        .filter((x): x is { v: number } => x.v != null)
      const atual = valores[valores.length - 1] ?? null
      const anterior = valores[valores.length - 2] ?? null
      return {
        chave,
        label,
        atual: atual?.v ?? null,
        anterior: anterior?.v ?? null,
        delta: atual && anterior ? atual.v - anterior.v : null,
      }
    })
    return linhas.filter((l) => l.atual != null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medidasAsc])

  const serieLinha = useMemo(
    () =>
      medidasAsc.map((m) => {
        const met = calcularMetricas(m, dobraDaMedida(m), perfil)
        return {
          data: fmtDataCurta(m.data),
          Peso: met.peso,
          IMC: met.imc != null ? Number(met.imc.toFixed(1)) : null,
          '%G': met.pctGordura != null ? Number(met.pctGordura.toFixed(1)) : null,
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [medidasAsc, dobras, perfil],
  )

  const serieRadar = useMemo(() => {
    if (medidasAsc.length < 2) return []
    const primeira = calcularMetricas(medidasAsc[0], dobraDaMedida(medidasAsc[0]), perfil)
    const ultimaMedida = medidasAsc[medidasAsc.length - 1]
    const ultima = calcularMetricas(ultimaMedida, dobraDaMedida(ultimaMedida), perfil)
    const partes: { metrica: string; a: number | null; b: number | null }[] = [
      { metrica: 'Braço', a: primeira.bracoMedio, b: ultima.bracoMedio },
      { metrica: 'Coxa', a: primeira.coxaMedia, b: ultima.coxaMedia },
      { metrica: 'Panturrilha', a: primeira.panturrilhaMedia, b: ultima.panturrilhaMedia },
      { metrica: 'Ombro', a: medidasAsc[0].ombro ?? null, b: ultimaMedida.ombro ?? null },
      { metrica: 'Cintura', a: medidasAsc[0].cintura ?? null, b: ultimaMedida.cintura ?? null },
    ]
    return partes
      .filter((p) => p.a != null && p.b != null)
      .map((p) => ({ metrica: p.metrica, Primeira: p.a, Atual: p.b }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medidasAsc, dobras, perfil])

  const progressao = useMemo(() => {
    const porExercicio = new Map<string, ExecucaoDetalhada[]>()
    for (const e of execucoes) {
      const nome = e.sessao_exercicio?.exercicio?.nome
      if (!nome || e.carga_usada == null) continue
      const arr = porExercicio.get(nome) ?? []
      arr.push(e)
      porExercicio.set(nome, arr)
    }
    return [...porExercicio.entries()]
      .map(([nome, lista]) => {
        const primeira = lista[0].carga_usada ?? 0
        const ultima = lista[lista.length - 1].carga_usada ?? 0
        return {
          nome,
          primeira,
          ultima,
          delta: ultima - primeira,
          registros: lista.length,
          reps: lista[lista.length - 1].reps_feitas,
        }
      })
      .sort((a, b) => b.delta - a.delta)
  }, [execucoes])

  const badges = useMemo(() => {
    const concluidas = execucoes.filter((e) => e.concluido)
    const semanas = new Set(concluidas.map((e) => semanaISO(new Date(e.data))))
    return [
      { id: 'primeiro', label: 'Primeiro treino', ok: treinos.length >= 1 },
      { id: 'dedicado', label: '10 execuções', ok: concluidas.length >= 10 },
      { id: 'consistente', label: '2 semanas ativas', ok: semanas.size >= 2 },
      { id: 'progressao', label: 'Carga em progressão', ok: progressao.some((p) => p.delta > 0) },
      { id: 'medicoes', label: '3 medições', ok: medidas.length >= 3 },
      { id: 'composicao', label: 'Composição registrada', ok: dobras.length >= 1 },
    ]
  }, [execucoes, treinos, progressao, medidas, dobras])

  if (carregando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const semDados = medidas.length === 0 && execucoes.length === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Evolução</h1>
          <p className="text-sm text-muted-foreground">Acompanhe métricas, cargas e conquistas.</p>
        </div>
        <Button asChild>
          <Link to="/medidas/nova">
            <Plus className="h-4 w-4" /> Nova medida
          </Link>
        </Button>
      </div>

      {semDados ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Comece registrando suas medidas e executando um treino para ver sua evolução aqui.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/medidas/nova">Registrar medida</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/treinos">Ver treinos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          titulo="IMC atual"
          valor={fmtNum(atual.imc)}
          unidade="kg/m²"
          badge={<DeltaBadge valor={delta(atual.imc, inicial.imc)} unidade="" inverterBom={true} />}
        />
        <MetricCard
          titulo="% Gordura"
          valor={fmtNum(atual.pctGordura)}
          unidade="%"
          descricao={atual.pctGorduraPollock ? 'Pollock 3 dobras' : 'US Navy'}
          badge={<DeltaBadge valor={delta(atual.pctGordura, inicial.pctGordura)} unidade="pp" inverterBom={true} />}
        />
        <MetricCard
          titulo="Massa magra"
          valor={fmtNum(atual.massaMagra)}
          unidade="kg"
          badge={<DeltaBadge valor={delta(atual.massaMagra, inicial.massaMagra)} unidade="kg" inverterBom={false} />}
        />
        <MetricCard
          titulo="Peso"
          valor={fmtNum(atual.peso)}
          unidade="kg"
          badge={<DeltaBadge valor={delta(atual.peso, inicial.peso)} unidade="kg" inverterBom={false} />}
        />
      </div>

      {balanca ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4" /> Balança de bioimpedância
            </CardTitle>
            <CardDescription>
              Comparação entre o cálculo (fita/pinça) e a leitura direta da balança em {fmtDataCurta(balanca.data)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {balanca.gordura_balanca != null ? (
              <>
                <MetricCard
                  titulo="% Gordura (Calculada)"
                  valor={fmtNum(balancaMet?.pctGordura ?? null)}
                  unidade="%"
                  badge={
                    balancaMet?.pctGordura != null ? (
                      <DeltaBadge
                        valor={delta(balanca.gordura_balanca, balancaMet.pctGordura)}
                        unidade="pp"
                        inverterBom={true}
                      />
                    ) : undefined
                  }
                />
                <MetricCard titulo="% Gordura (Balança)" valor={fmtNum(balanca.gordura_balanca)} unidade="%" />
              </>
            ) : null}
            {balanca.massa_magra_balanca != null ? (
              <>
                <MetricCard
                  titulo="Massa magra (Calculada)"
                  valor={fmtNum(balancaMet?.massaMagra ?? null)}
                  unidade="kg"
                  badge={
                    balancaMet?.massaMagra != null ? (
                      <DeltaBadge
                        valor={delta(balanca.massa_magra_balanca, balancaMet.massaMagra)}
                        unidade="kg"
                        inverterBom={false}
                      />
                    ) : undefined
                  }
                />
                <MetricCard titulo="Massa magra (Balança)" valor={fmtNum(balanca.massa_magra_balanca)} unidade="kg" />
              </>
            ) : null}
            {balanca.agua_corporal != null ? (
              <MetricCard titulo="Água corporal (Balança)" valor={fmtNum(balanca.agua_corporal)} unidade="%" />
            ) : null}
            {balanca.massa_ossea != null ? (
              <MetricCard titulo="Massa óssea (Balança)" valor={fmtNum(balanca.massa_ossea)} unidade="kg" />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução da fita métrica</CardTitle>
          <CardDescription>Perímetros mais recentes e a comparação com a medição anterior (cm).</CardDescription>
        </CardHeader>
        <CardContent>
          {perimetros.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Perímetro</TableHead>
                  <TableHead className="text-right">Atual</TableHead>
                  <TableHead className="text-right">Anterior</TableHead>
                  <TableHead className="text-right">Δ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perimetros.map((p) => (
                  <TableRow key={p.chave}>
                    <TableCell className="font-medium">{p.label}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{fmtNum(p.atual)} cm</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {p.anterior != null ? `${fmtNum(p.anterior)} cm` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.delta != null ? (
                        <Badge variant="secondary">
                          {p.delta > 0 ? '+' : ''}
                          {fmtNum(p.delta)} cm
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Registre perímetros em "Nova medida" para acompanhar a evolução da fita métrica.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linha do tempo</CardTitle>
          <CardDescription>Peso, IMC e percentual de gordura ao longo do tempo.</CardDescription>
        </CardHeader>
        <CardContent>
          {serieLinha.length >= 2 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={serieLinha} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Peso" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="IMC" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="%G" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Registre ao menos duas medidas para visualizar a linha do tempo.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perímetros: primeira × atual</CardTitle>
            <CardDescription>Comparativo das circunferências registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            {serieRadar.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={serieRadar}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="metrica" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fontSize: 10 }} />
                  <Radar name="Primeira" dataKey="Primeira" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.35} />
                  <Radar name="Atual" dataKey="Atual" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.35} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Registre perímetros em duas medições para o gráfico de radar.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4" /> Conquistas
            </CardTitle>
            <CardDescription>Marcos alcançados com seus registros.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <Badge key={b.id} variant={b.ok ? 'success' : 'secondary'} className={b.ok ? '' : 'opacity-60'}>
                {b.label}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tabela de progressão</CardTitle>
          <CardDescription>Variação de carga por exercício entre a primeira e a última execução.</CardDescription>
        </CardHeader>
        <CardContent>
          {progressao.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercício</TableHead>
                  <TableHead className="text-right">Inicial</TableHead>
                  <TableHead className="text-right">Atual</TableHead>
                  <TableHead className="text-right">Δ</TableHead>
                  <TableHead className="text-right">Sessões</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progressao.map((p) => (
                  <TableRow key={p.nome}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(p.primeira)} kg</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(p.ultima)} kg</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={p.delta > 0 ? 'success' : p.delta < 0 ? 'destructive' : 'secondary'}>
                        {p.delta > 0 ? '+' : ''}
                        {fmtNum(p.delta)} kg
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.registros}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Registre execuções com carga para acompanhar a progressão.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function delta(atual: number | null, inicial: number | null): number | null {
  if (atual == null || inicial == null) return null
  return atual - inicial
}

function DeltaBadge({
  valor,
  unidade,
  inverterBom,
}: {
  valor: number | null
  unidade: string
  inverterBom: boolean
}) {
  if (valor == null || Math.abs(valor) < 0.05) {
    return <Badge variant="secondary">estável</Badge>
  }
  const positivo = valor > 0
  const bom = inverterBom ? !positivo : positivo
  return (
    <Badge variant={bom ? 'success' : 'destructive'}>
      {positivo ? '+' : ''}
      {fmtNum(valor)} {unidade}
    </Badge>
  )
}

function semanaISO(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dia = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dia)
  const inicioAno = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const semana = Math.ceil(((date.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-${semana}`
}