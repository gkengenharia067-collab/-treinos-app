import { useMemo, useState } from 'react'
import { ArrowLeft, Calculator, Loader2, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MetricCard } from '@/components/MetricCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/auth'
import { inserirDobra, inserirMedida } from '@/lib/data'
import { fmtNum } from '@/lib/format'
import { calcularMetricas } from '@/lib/metricas'
import type { DobraCutanea, Medida } from '@/lib/types'

const CAMPOS_MEDIDA: { chave: string; label: string; sufixo: string }[] = [
  { chave: 'cintura', label: 'Cintura', sufixo: 'cm' },
  { chave: 'quadril', label: 'Quadril', sufixo: 'cm' },
  { chave: 'abdomen', label: 'Abdômen', sufixo: 'cm' },
  { chave: 'torax', label: 'Tórax', sufixo: 'cm' },
  { chave: 'ombro', label: 'Ombro', sufixo: 'cm' },
  { chave: 'pescoco', label: 'Pescoço', sufixo: 'cm' },
  { chave: 'braco_d', label: 'Braço direito', sufixo: 'cm' },
  { chave: 'braco_e', label: 'Braço esquerdo', sufixo: 'cm' },
  { chave: 'coxa_d', label: 'Coxa direita', sufixo: 'cm' },
  { chave: 'coxa_e', label: 'Coxa esquerda', sufixo: 'cm' },
  { chave: 'panturrilha_d', label: 'Panturrilha direita', sufixo: 'cm' },
  { chave: 'panturrilha_e', label: 'Panturrilha esquerda', sufixo: 'cm' },
]

const CAMPOS_DOBRA: { chave: string; label: string }[] = [
  { chave: 'triceps', label: 'Tríceps' },
  { chave: 'subescapular', label: 'Subescapular' },
  { chave: 'suprailiaca', label: 'Suprailíaca' },
  { chave: 'biceps', label: 'Bíceps' },
  { chave: 'peitoral', label: 'Peitoral' },
  { chave: 'axilar_media', label: 'Axilar média' },
  { chave: 'coxa', label: 'Coxa' },
  { chave: 'abdomen', label: 'Abdômen' },
]

export function MedidasNova() {
  const { usuario, perfil } = useAuth()
  const navigate = useNavigate()
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({
    peso_kg: '',
    altura_cm: perfil?.altura_cm ? String(perfil.altura_cm) : '',
  })

  function set(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function numero(campo: string): number | undefined {
    const v = form[campo]
    if (v == null || v === '') return undefined
    const n = Number(v)
    return Number.isNaN(n) ? undefined : n
  }

  const medidaPreview: Medida = useMemo(
    () => ({
      id: 'preview',
      usuario_id: usuario?.id ?? '',
      data: new Date().toISOString(),
      peso_kg: numero('peso_kg') ?? null,
      altura_cm: numero('altura_cm') ?? null,
      cintura: numero('cintura') ?? null,
      quadril: numero('quadril') ?? null,
      abdomen: numero('abdomen') ?? null,
      torax: numero('torax') ?? null,
      ombro: numero('ombro') ?? null,
      pescoco: numero('pescoco') ?? null,
      braco_d: numero('braco_d') ?? null,
      braco_e: numero('braco_e') ?? null,
      coxa_d: numero('coxa_d') ?? null,
      coxa_e: numero('coxa_e') ?? null,
      panturrilha_d: numero('panturrilha_d') ?? null,
      panturrilha_e: numero('panturrilha_e') ?? null,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, usuario?.id],
  )

  const dobraPreview: DobraCutanea = useMemo(
    () => ({
      id: 'preview',
      usuario_id: usuario?.id ?? '',
      data: new Date().toISOString(),
      triceps: numero('triceps') ?? null,
      subescapular: numero('subescapular') ?? null,
      suprailiaca: numero('suprailiaca') ?? null,
      biceps: numero('biceps') ?? null,
      peitoral: numero('peitoral') ?? null,
      axilar_media: numero('axilar_media') ?? null,
      coxa: numero('coxa') ?? null,
      abdomen: numero('abdomen') ?? null,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, usuario?.id],
  )

  const metricas = useMemo(
    () => calcularMetricas(medidaPreview, dobraPreview, perfil),
    [medidaPreview, dobraPreview, perfil],
  )

  async function salvar() {
    if (!usuario) return
    if (!numero('peso_kg')) {
      toast.error('Informe ao menos o peso.')
      return
    }
    setSalvando(true)
    try {
      const data = new Date().toISOString()
      await inserirMedida(usuario.id, {
        data,
        peso_kg: numero('peso_kg') ?? null,
        altura_cm: numero('altura_cm') ?? null,
        cintura: numero('cintura') ?? null,
        quadril: numero('quadril') ?? null,
        abdomen: numero('abdomen') ?? null,
        torax: numero('torax') ?? null,
        ombro: numero('ombro') ?? null,
        pescoco: numero('pescoco') ?? null,
        braco_d: numero('braco_d') ?? null,
        braco_e: numero('braco_e') ?? null,
        coxa_d: numero('coxa_d') ?? null,
        coxa_e: numero('coxa_e') ?? null,
        panturrilha_d: numero('panturrilha_d') ?? null,
        panturrilha_e: numero('panturrilha_e') ?? null,
      })

      const temDobra = CAMPOS_DOBRA.some((c) => numero(c.chave as string) != null)
      if (temDobra) {
        await inserirDobra(usuario.id, {
          data,
          triceps: numero('triceps') ?? null,
          subescapular: numero('subescapular') ?? null,
          suprailiaca: numero('suprailiaca') ?? null,
          biceps: numero('biceps') ?? null,
          peitoral: numero('peitoral') ?? null,
          axilar_media: numero('axilar_media') ?? null,
          coxa: numero('coxa') ?? null,
          abdomen: numero('abdomen') ?? null,
        })
      }

      toast.success('Medidas registradas!')
      navigate('/evolucao')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Nova medida</h1>
          <p className="text-sm text-muted-foreground">Registre medidas e dobras cutâneas</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard titulo="IMC" valor={fmtNum(metricas.imc)} unidade="kg/m²" />
        <MetricCard
          titulo="% Gordura"
          valor={fmtNum(metricas.pctGordura)}
          unidade="%"
          descricao={metricas.pctGorduraPollock ? 'Pollock 3 dobras' : metricas.pctGorduraNavy ? 'US Navy' : 'sem dados'}
        />
        <MetricCard titulo="Massa magra" valor={fmtNum(metricas.massaMagra)} unidade="kg" />
        <MetricCard titulo="Massa gorda" valor={fmtNum(metricas.massaGorda)} unidade="kg" />
        <MetricCard titulo="RCQ" valor={fmtNum(metricas.rcq, 2)} descricao="cintura / quadril" />
        <MetricCard titulo="CMB" valor={fmtNum(metricas.cmb)} unidade="cm" descricao="braço − π·DCT" />
        <MetricCard titulo="%G US Navy" valor={fmtNum(metricas.pctGorduraNavy)} unidade="%" />
        <MetricCard titulo="%G Pollock" valor={fmtNum(metricas.pctGorduraPollock)} unidade="%" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4" /> Dados principais
          </CardTitle>
          <CardDescription>Peso e altura alimentam IMC e composição corporal.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Campo label="Peso" campo="peso_kg" sufixo="kg" valor={form.peso_kg} set={set} step="0.1" />
          <Campo label="Altura" campo="altura_cm" sufixo="cm" valor={form.altura_cm} set={set} step="0.1" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Circunferências</CardTitle>
          <CardDescription>Todas em centímetros. Preencha o que tiver.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAMPOS_MEDIDA.map((c) => (
            <Campo
              key={c.chave}
              label={c.label}
              campo={c.chave}
              sufixo={c.sufixo}
              valor={form[c.chave] ?? ''}
              set={set}
              step="0.1"
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dobras cutâneas (mm)</CardTitle>
          <CardDescription>
            Opcional. Homens: peitoral + abdômen + coxa. Mulheres: tríceps + suprailíaca + coxa (Pollock 3).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CAMPOS_DOBRA.map((c) => (
            <Campo
              key={c.chave}
              label={c.label}
              campo={c.chave as string}
              sufixo="mm"
              valor={form[c.chave] ?? ''}
              set={set}
              step="0.5"
            />
          ))}
        </CardContent>
      </Card>

      <Separator />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(-1)} disabled={salvando}>
          Cancelar
        </Button>
        <Button onClick={() => void salvar()} disabled={salvando}>
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar medida
        </Button>
      </div>
    </div>
  )
}

function Campo({
  label,
  campo,
  sufixo,
  valor,
  set,
  step,
}: {
  label: string
  campo: string
  sufixo: string
  valor: string
  set: (campo: string, valor: string) => void
  step?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={campo}>
        {label} <span className="text-xs text-muted-foreground">({sufixo})</span>
      </Label>
      <Input
        id={campo}
        type="number"
        inputMode="decimal"
        step={step}
        value={valor}
        onChange={(e) => set(campo, e.target.value)}
      />
    </div>
  )
}