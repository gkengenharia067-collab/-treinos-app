import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Dumbbell, Loader2, MailCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/context/auth'
import {
  DIAS_DISPONIVEIS,
  DIVISOES,
  EQUIPAMENTOS,
  NIVEIS,
  OBJETIVOS,
} from '@/lib/constants'
import { carregarCatalogo, carregarPreferencia, gerarTreino, inserirMedida, salvarPreferencia } from '@/lib/data'
import type { Divisao, Nivel, Objetivo, Restricao, Sexo } from '@/lib/types'
import { cn } from '@/lib/utils'
import { createSupabaseError, isSupabaseConfigured, supabase } from '@/lib/supabase'

interface WizardData {
  nome: string
  email: string
  senha: string
  confirmar: string
  dataNasc: string
  sexo: Sexo | ''
  peso: string
  altura: string
  objetivo: Objetivo | ''
  divisao: Divisao | ''
  dias: number[]
  nivel: Nivel | ''
  equipamentos: string[]
  restricoes: number[]
}

const DRAFT_KEY = 'treina_wizard_draft'

const dadosIniciais: WizardData = {
  nome: '',
  email: '',
  senha: '',
  confirmar: '',
  dataNasc: '',
  sexo: '',
  peso: '',
  altura: '',
  objetivo: '',
  divisao: '',
  dias: [],
  nivel: '',
  equipamentos: [],
  restricoes: [],
}

const PASSOS = [
  'Conta',
  'Medidas',
  'Objetivo',
  'Divisão',
  'Dias',
  'Nível',
  'Equipamentos',
  'Restrições',
]

export function Cadastro() {
  const { usuario, perfil, registrar, atualizarPerfil, carregando } = useAuth()
  const navigate = useNavigate()
  const [passo, setPasso] = useState(0)
  const [dados, setDados] = useState<WizardData>(() => {
    try {
      const salvo = localStorage.getItem(DRAFT_KEY)
      if (salvo) return { ...dadosIniciais, ...(JSON.parse(salvo) as Partial<WizardData>) }
    } catch {
      /* ignora */
    }
    return dadosIniciais
  })
  const [restricoes, setRestricoes] = useState<Restricao[]>([])
  const [enviando, setEnviando] = useState(false)
  const [confirmarEmail, setConfirmarEmail] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(dados))
    } catch {
      /* ignora */
    }
  }, [dados])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void carregarCatalogo()
      .then((c) => setRestricoes(c.restricoes))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!usuario || carregando) return
    void carregarPreferencia(usuario.id).then((pref) => {
      if (pref) {
        localStorage.removeItem(DRAFT_KEY)
        navigate('/dashboard', { replace: true })
      }
    })
  }, [usuario, carregando, navigate])

  useEffect(() => {
    if (usuario && perfil) {
      setDados((d) => ({
        ...d,
        nome: d.nome || perfil.nome,
        email: d.email || perfil.email,
      }))
    }
  }, [usuario, perfil])

  const podeSeguir = useMemo(() => validarPasso(passo, dados), [passo, dados])
  const totalPassos = PASSOS.length

  function atualizar(patch: Partial<WizardData>) {
    setDados((d) => ({ ...d, ...patch }))
  }

  function alternar(lista: number[], valor: number): number[] {
    return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]
  }

  function alternarTexto(lista: string[], valor: string): string[] {
    return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]
  }

  async function finalizar() {
    if (!isSupabaseConfigured) {
      toast.error('Supabase não configurado.')
      return
    }
    setEnviando(true)
    try {
      let uid = usuario?.id ?? ''
      if (!usuario) {
        const temSessao = await registrar(dados.email.trim(), dados.senha, dados.nome.trim())
        if (!temSessao) {
          setConfirmarEmail(true)
          return
        }
        const { data } = await supabase!.auth.getUser()
        uid = data.user?.id ?? ''
      }
      if (!uid) throw new Error('Não foi possível identificar o usuário.')

      await atualizarPerfil({
        nome: dados.nome.trim(),
        data_nasc: dados.dataNasc || null,
        sexo: (dados.sexo || null) as Sexo | null,
        altura_cm: dados.altura ? Number(dados.altura) : null,
      })

      const preferencia = {
        divisao: dados.divisao as Divisao,
        objetivo: dados.objetivo as Objetivo,
        nivel: dados.nivel as Nivel,
        equipamentos: dados.equipamentos,
        restricoes: dados.restricoes,
        dias_semana: dados.dias,
      }
      await salvarPreferencia(uid, preferencia)

      if (dados.peso) {
        await inserirMedida(uid, {
          peso_kg: Number(dados.peso),
          altura_cm: dados.altura ? Number(dados.altura) : null,
          data: new Date().toISOString(),
        })
      }

      const catalogo = await carregarCatalogo()
      await gerarTreino({
        usuarioId: uid,
        preferencia,
        catalogo,
        versao: 1,
        nome: `Treino ${DIVISOES[preferencia.divisao].label}`,
        arquivar: null,
      })

      localStorage.removeItem(DRAFT_KEY)
      toast.success('Treino gerado com sucesso!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : createSupabaseError(err))
    } finally {
      setEnviando(false)
    }
  }

  if (confirmarEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="items-center">
            <MailCheck className="h-10 w-10 text-primary" />
            <CardTitle>Confirme seu e-mail</CardTitle>
            <CardDescription>
              Enviamos um link de confirmação para <strong>{dados.email}</strong>. Após confirmar, faça login para
              concluir a geração do seu treino — seus dados ficaram salvos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Ir para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Monte seu treino</h1>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Passo {passo + 1} de {totalPassos} · {PASSOS[passo]}
            </span>
            <span>{Math.round(((passo + 1) / totalPassos) * 100)}%</span>
          </div>
          <Progress value={((passo + 1) / totalPassos) * 100} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{tituloDoPasso(passo)}</CardTitle>
            <CardDescription>{descricaoDoPasso(passo)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {passo === 0 && <PassoConta dados={dados} atualizar={atualizar} jaLogado={Boolean(usuario)} />}
            {passo === 1 && <PassoMedidas dados={dados} atualizar={atualizar} />}
            {passo === 2 && (
              <GradeOpcoes
                opcoes={Object.entries(OBJETIVOS).map(([valor, o]) => ({
                  valor,
                  titulo: o.label,
                  descricao: o.desc,
                }))}
                selecionado={dados.objetivo}
                onSelect={(v) => atualizar({ objetivo: v as Objetivo })}
              />
            )}
            {passo === 3 && (
              <GradeOpcoes
                opcoes={Object.entries(DIVISOES).map(([valor, d]) => ({
                  valor,
                  titulo: d.label,
                  descricao: `${d.desc} · ${d.diasNecessarios}x/semana`,
                }))}
                selecionado={dados.divisao}
                onSelect={(v) => atualizar({ divisao: v as Divisao })}
              />
            )}
            {passo === 4 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Escolha os dias em que você treina. Sua divisão escolhida recomenda pelo menos{' '}
                  <strong>{dados.divisao ? DIVISOES[dados.divisao].diasNecessarios : '—'}</strong> dia(s).
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {DIAS_DISPONIVEIS.map((dia) => {
                    const ativo = dados.dias.includes(dia.valor)
                    return (
                      <button
                        key={dia.valor}
                        type="button"
                        onClick={() => atualizar({ dias: alternar(dados.dias, dia.valor) })}
                        className={cn(
                          'rounded-lg border p-3 text-sm font-medium transition-colors',
                          ativo ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent',
                        )}
                      >
                        {dia.rotulo}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {passo === 5 && (
              <GradeOpcoes
                opcoes={Object.entries(NIVEIS).map(([valor, n]) => ({
                  valor,
                  titulo: n.label,
                  descricao: n.desc,
                }))}
                selecionado={dados.nivel}
                onSelect={(v) => atualizar({ nivel: v as Nivel })}
              />
            )}
            {passo === 6 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {EQUIPAMENTOS.map((eq) => {
                  const ativo = dados.equipamentos.includes(eq.valor)
                  return (
                    <label
                      key={eq.valor}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors',
                        ativo ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                      )}
                    >
                      <Checkbox
                        checked={ativo}
                        onCheckedChange={() => atualizar({ equipamentos: alternarTexto(dados.equipamentos, eq.valor) })}
                      />
                      {eq.label}
                    </label>
                  )
                })}
              </div>
            )}
            {passo === 7 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Marque as restrições que você possui. Exercícios com risco são filtrados automaticamente e outros
                  recebem aviso de cautela.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {restricoes.map((r) => {
                    const ativo = dados.restricoes.includes(r.id)
                    return (
                      <label
                        key={r.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-medium capitalize transition-colors',
                          ativo ? 'border-amber-500 bg-amber-500/10' : 'hover:bg-accent',
                        )}
                      >
                        <Checkbox
                          checked={ativo}
                          onCheckedChange={() => atualizar({ restricoes: alternar(dados.restricoes, r.id) })}
                        />
                        {r.nome}
                      </label>
                    )
                  })}
                </div>
                {dados.restricoes.length === 0 && (
                  <Badge variant="secondary">Nenhuma restrição selecionada</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPasso((p) => Math.max(0, p - 1))}
            disabled={passo === 0 || enviando}
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
          {passo < totalPassos - 1 ? (
            <Button onClick={() => setPasso((p) => Math.min(totalPassos - 1, p + 1))} disabled={!podeSeguir}>
              Continuar <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => void finalizar()} disabled={!podeSeguir || enviando}>
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Gerar meu treino
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function PassoConta({
  dados,
  atualizar,
  jaLogado,
}: {
  dados: WizardData
  atualizar: (patch: Partial<WizardData>) => void
  jaLogado: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" value={dados.nome} onChange={(e) => atualizar({ nome: e.target.value })} placeholder="Seu nome" />
      </div>
      {!jaLogado && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={dados.email}
              onChange={(e) => atualizar({ email: e.target.value })}
              placeholder="voce@email.com"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={dados.senha}
                onChange={(e) => atualizar({ senha: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar senha</Label>
              <Input
                id="confirmar"
                type="password"
                value={dados.confirmar}
                onChange={(e) => atualizar({ confirmar: e.target.value })}
              />
            </div>
          </div>
        </>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nasc">Data de nascimento</Label>
          <Input
            id="nasc"
            type="date"
            value={dados.dataNasc}
            onChange={(e) => atualizar({ dataNasc: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Sexo</Label>
          <div className="flex gap-2">
            {(['masculino', 'feminino'] as Sexo[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => atualizar({ sexo: s })}
                className={cn(
                  'flex-1 rounded-lg border p-3 text-sm font-medium capitalize transition-colors',
                  dados.sexo === s ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      {!jaLogado && (
        <p className="text-xs text-muted-foreground">
          Ao finalizar, criaremos sua conta no Supabase Auth. Se a confirmação por e-mail estiver ativa, você receberá um
          link.
        </p>
      )}
    </div>
  )
}

function PassoMedidas({
  dados,
  atualizar,
}: {
  dados: WizardData
  atualizar: (patch: Partial<WizardData>) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="peso">Peso atual (kg)</Label>
        <Input
          id="peso"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={dados.peso}
          onChange={(e) => atualizar({ peso: e.target.value })}
          placeholder="ex.: 78.5"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="altura">Altura (cm)</Label>
        <Input
          id="altura"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={dados.altura}
          onChange={(e) => atualizar({ altura: e.target.value })}
          placeholder="ex.: 178"
        />
      </div>
    </div>
  )
}

function GradeOpcoes({
  opcoes,
  selecionado,
  onSelect,
}: {
  opcoes: { valor: string; titulo: string; descricao: string }[]
  selecionado: string
  onSelect: (valor: string) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {opcoes.map((o) => {
        const ativo = selecionado === o.valor
        return (
          <button
            key={o.valor}
            type="button"
            onClick={() => onSelect(o.valor)}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors',
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

function validarPasso(passo: number, d: WizardData): boolean {
  switch (passo) {
    case 0:
      if (d.nome.trim().length < 2) return false
      if (!d.dataNasc || !d.sexo) return false
      return true
    case 1:
      return Number(d.peso) > 0 && Number(d.altura) > 0
    case 2:
      return Boolean(d.objetivo)
    case 3:
      return Boolean(d.divisao)
    case 4: {
      if (!d.divisao) return false
      return d.dias.length >= DIVISOES[d.divisao].diasNecessarios
    }
    case 5:
      return Boolean(d.nivel)
    case 6:
      return d.equipamentos.length > 0
    default:
      return true
  }
}

function tituloDoPasso(passo: number): string {
  return [
    'Dados pessoais',
    'Suas medidas',
    'Qual é o seu objetivo?',
    'Escolha a divisão',
    'Dias disponíveis',
    'Qual seu nível?',
    'Equipamentos disponíveis',
    'Restrições e lesões',
  ][passo]
}

function descricaoDoPasso(passo: number): string {
  return [
    'Crie seu acesso e informe dados básicos.',
    'Usamos essas informações para calcular IMC, %G e massa magra.',
    'O objetivo define séries, repetições e descanso.',
    'A divisão define como os treinos são organizados na semana.',
    'Quantos e quais dias você consegue treinar.',
    'O nível define o método de progressão de carga.',
    'O que você tem disponível para treinar.',
    'Selecione para evitar exercícios contraindicados.',
  ][passo]
}