import { useEffect, useMemo, useState } from 'react'
import { Activity, CalendarDays, Dumbbell, Flame, Loader2, Plus, Ruler, TrendingUp } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MetricCard } from '@/components/MetricCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/auth'
import { DIVISAO_LABEL, OBJETIVO_LABEL } from '@/lib/constants'
import { carregarPreferencia, listarDobras, listarMedidas, listarTreinosCompletos, type TreinoDetalhado } from '@/lib/data'
import { fmtDataCurta, fmtNum, diasDaSemana } from '@/lib/format'
import { calcularMetricas } from '@/lib/metricas'
import type { DobraCutanea, Medida, PreferenciaTreino } from '@/lib/types'

export function Dashboard() {
  const { usuario, perfil } = useAuth()
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [treinos, setTreinos] = useState<TreinoDetalhado[]>([])
  const [medidas, setMedidas] = useState<Medida[]>([])
  const [dobras, setDobras] = useState<DobraCutanea[]>([])
  const [pref, setPref] = useState<PreferenciaTreino | null>(null)

  useEffect(() => {
    if (!usuario) return
    let ativo = true
    void Promise.all([
      listarTreinosCompletos(usuario.id),
      listarMedidas(usuario.id),
      listarDobras(usuario.id),
      carregarPreferencia(usuario.id),
    ])
      .then(([t, m, d, p]) => {
        if (!ativo) return
        setTreinos(t)
        setMedidas(m)
        setDobras(d)
        setPref(p)
        if (!p) navigate('/cadastro', { replace: true })
      })
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [usuario, navigate])

  const ativo = useMemo(() => treinos.find((t) => t.status === 'ativo') ?? null, [treinos])
  const ultimaMedida = medidas[0] ?? null
  const ultimaDobra = dobras[0] ?? null
  const metricas = useMemo(
    () => calcularMetricas(ultimaMedida, ultimaDobra, perfil),
    [ultimaMedida, ultimaDobra, perfil],
  )

  const serie = useMemo(
    () =>
      [...medidas]
        .filter((m) => m.peso_kg != null)
        .reverse()
        .map((m) => ({ data: fmtDataCurta(m.data), peso: m.peso_kg })),
    [medidas],
  )

  const treinosRecentes = useMemo(
    () =>
      [...treinos]
        .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
        .slice(0, 3),
    [treinos],
  )

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
          <h1 className="text-2xl font-bold">Olá, {perfil?.nome?.split(' ')[0] ?? 'atleta'} 👋</h1>
          <p className="text-sm text-muted-foreground">
            {pref
              ? `${DIVISAO_LABEL[pref.divisao]} · ${OBJETIVO_LABEL[pref.objetivo]} · ${diasDaSemana(pref.dias_semana)}`
              : 'Configure suas preferências para começar.'}
          </p>
        </div>
        <Button asChild>
          <Link to="/medidas/nova">
            <Plus className="h-4 w-4" /> Nova medida
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          titulo="Peso"
          valor={fmtNum(metricas.peso)}
          unidade="kg"
          descricao={ultimaMedida ? `em ${fmtDataCurta(ultimaMedida.data)}` : 'sem registro'}
          icone={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          titulo="IMC"
          valor={fmtNum(metricas.imc)}
          unidade="kg/m²"
          descricao={metricas.imc ? categoria(metricas.imc) : 'sem dados'}
          icone={<Ruler className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          titulo="% Gordura"
          valor={fmtNum(metricas.pctGordura)}
          unidade="%"
          descricao={metricas.pctGorduraPollock ? 'Pollock 3 dobras' : 'US Navy'}
          icone={<Flame className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          titulo="Massa magra"
          valor={fmtNum(metricas.massaMagra)}
          unidade="kg"
          descricao={metricas.massaGorda != null ? `${fmtNum(metricas.massaGorda)} kg de gordura` : 'sem dados'}
          icone={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Evolução do peso
            </CardTitle>
            <CardDescription>Acompanhe a linha do tempo das suas pesagens.</CardDescription>
          </CardHeader>
          <CardContent>
            {serie.length >= 2 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={serie} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="data" tick={{ fontSize: 12 }} stroke="currentColor" className="text-muted-foreground" />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} stroke="currentColor" className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`${fmtNum(Number(v))} kg`, 'Peso']}
                  />
                  <Line type="monotone" dataKey="peso" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-52 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Ruler className="h-6 w-6" />
                Registre pelo menos duas medidas para ver o gráfico.
                <Button asChild variant="outline" size="sm">
                  <Link to="/medidas/nova">Registrar medida</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="h-4 w-4" /> Treino ativo
            </CardTitle>
            <CardDescription>
              {ativo ? `${DIVISAO_LABEL[ativo.divisao]} · v${ativo.versao}` : 'Nenhum treino ativo'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ativo ? (
              ativo.sessoes.map((s) => (
                <Link
                  key={s.id}
                  to={`/treino/${s.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">
                    {s.letra} · {s.nome}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {s.exercicios.filter((e) => e.tipo === 'forca').length} exercícios
                  </span>
                </Link>
              ))
            ) : (
              <Button asChild className="w-full">
                <Link to="/treinos">Gerar treino</Link>
              </Button>
            )}
            {ativo ? (
              <Button asChild variant="outline" className="w-full">
                <Link to="/treinos">Ver todos os treinos</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" /> Histórico de treinos
          </CardTitle>
          <CardDescription>Seus treinos mais recentes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {treinosRecentes.length ? (
            treinosRecentes.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {DIVISAO_LABEL[t.divisao]} · {OBJETIVO_LABEL[t.objetivo]} · {fmtDataCurta(t.criado_em)}
                  </p>
                </div>
                <Badge variant={t.status === 'ativo' ? 'success' : 'secondary'}>
                  {t.status === 'ativo' ? 'Ativo' : 'Arquivado'}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum treino gerado ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function categoria(imc: number): string {
  if (imc < 18.5) return 'Abaixo do peso'
  if (imc < 25) return 'Peso normal'
  if (imc < 30) return 'Sobrepeso'
  return 'Obesidade'
}