import { GRUPOS_COMPOSTOS, NIVEIS, OBJETIVOS, SPLIT_POR_DIAS } from './constants'
import type {
  Exercicio,
  ExercicioRestricao,
  Nivel,
  Objetivo,
  PreferenciaTreino,
  TipoExercicio,
} from './types'

export interface ExercicioGerado {
  exercicio_id: number
  ordem: number
  tipo: TipoExercicio
  series?: number | null
  reps_min?: number | null
  reps_max?: number | null
  reps?: string | null
  carga?: number | null
  tempo_descanso?: number | null
  obs?: string | null
  metodo_progressao?: string | null
  rpe_alvo?: number | null
}

export interface SessaoGerada {
  letra: string
  nome: string
  exercicios: ExercicioGerado[]
}

export interface FiltroGeracao {
  evitar: Set<number>
  cautela: Map<number, number[]>
}

export function buildFiltro(
  restricaoIds: number[],
  mapa: ExercicioRestricao[],
): FiltroGeracao {
  const evitar = new Set<number>()
  const cautela = new Map<number, number[]>()
  if (!restricaoIds?.length) return { evitar, cautela }
  for (const m of mapa) {
    if (!restricaoIds.includes(m.restricao_id)) continue
    if (m.nivel === 'evitar') {
      evitar.add(m.exercicio_id)
    } else {
      const arr = cautela.get(m.exercicio_id) ?? []
      arr.push(m.restricao_id)
      cautela.set(m.exercicio_id, arr)
    }
  }
  return { evitar, cautela }
}

function equipamentosCompatível(e: Exercicio, prefs: string[]): boolean {
  if (!prefs?.length) return true
  return e.equipamentos.some((eq) => prefs.includes(eq))
}

function pickKRandom<T>(arr: T[], k: number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a.slice(0, Math.min(k, a.length))
}

function notaCautela(
  ex: Exercicio,
  filtro: FiltroGeracao,
  nomesRestricao: Map<number, string>,
): string | null {
  const ids = filtro.cautela.get(ex.id)
  if (!ids?.length) return null
  const nomes = ids.map((i) => nomesRestricao.get(i) ?? `restrição ${i}`)
  return `⚠ Cautela (${nomes.join(', ')}): realize sem forçar e interrompa se houver dor.`
}

function poolPorGrupo(exercicios: Exercicio[], filtro: FiltroGeracao, prefsEq: string[]): Map<string, Exercicio[]> {
  const map = new Map<string, Exercicio[]>()
  for (const e of exercicios) {
    if (e.tipo !== 'forca') continue
    if (filtro.evitar.has(e.id)) continue
    if (!equipamentosCompatível(e, prefsEq)) continue
    const arr = map.get(e.grupo_muscular) ?? []
    arr.push(e)
    map.set(e.grupo_muscular, arr)
  }
  return map
}

function escolher(pool: Map<string, Exercicio[]>, grupo: string, count: number): Exercicio[] {
  return pickKRandom(pool.get(grupo) ?? [], count)
}

function prescrever(
  ex: Exercicio,
  objetivo: Objetivo,
  nivel: Nivel,
): Pick<
  ExercicioGerado,
  'series' | 'reps_min' | 'reps_max' | 'reps' | 'tempo_descanso' | 'metodo_progressao' | 'rpe_alvo'
> {
  // Cardio é prescrito por duração, não por séries/repetições de carga.
  if (ex.grupo_muscular === 'cardio') {
    return {
      series: null,
      reps_min: null,
      reps_max: null,
      reps: '10–15 min',
      tempo_descanso: 0,
      metodo_progressao: null,
      rpe_alvo: null,
    }
  }
  const p = OBJETIVOS[objetivo]
  const composto = GRUPOS_COMPOSTOS.has(ex.grupo_muscular)
  const metodo = NIVEIS[nivel].metodo
  return {
    series: composto ? p.seriesComp : p.seriesIso,
    reps_min: p.repsMin,
    reps_max: p.repsMax,
    reps: null,
    tempo_descanso: composto ? p.restComp : p.restIso,
    metodo_progressao: metodo,
    rpe_alvo: metodo === 'rpe' ? 8 : null,
  }
}

function mountExercicio(
  ex: Exercicio,
  ordem: number,
  prescricao: Partial<ExercicioGerado> | null,
  filtro: FiltroGeracao,
  nomesRestricao: Map<number, string>,
): ExercicioGerado {
  const obsCautela = notaCautela(ex, filtro, nomesRestricao)
  const obs = obsCautela ? obsCautela : null
  return {
    exercicio_id: ex.id,
    ordem,
    tipo: ex.tipo,
    series: prescricao?.series ?? null,
    reps_min: prescricao?.reps_min ?? null,
    reps_max: prescricao?.reps_max ?? null,
    reps: prescricao?.reps ?? null,
    carga: null,
    tempo_descanso: prescricao?.tempo_descanso ?? 0,
    obs,
    metodo_progressao: prescricao?.metodo_progressao ?? null,
    rpe_alvo: prescricao?.rpe_alvo ?? null,
  }
}

const WARMUP_MOBILIDADE = 4
const WARMUP_ESTABILIDADE = 2
const WARMUP_AQUECIMENTO_POR_GRUPO = 1

function montarAquecimento(
  gruposDoDia: string[],
  catalogo: Exercicio[],
  filtro: FiltroGeracao,
  nomesRestricao: Map<number, string>,
): ExercicioGerado[] {
  const out: ExercicioGerado[] = []
  let ordem = 0

  const mobilidade = catalogo.filter((e) => e.tipo === 'mobilidade' && !filtro.evitar.has(e.id))
  const estabilidade = catalogo.filter((e) => e.tipo === 'estabilidade' && !filtro.evitar.has(e.id))

  for (const ex of pickKRandom(mobilidade, WARMUP_MOBILIDADE)) {
    out.push(
      mountExercicio(
        ex,
        ordem++,
        { series: 1, reps: '8–10 cada', tempo_descanso: 0 },
        filtro,
        nomesRestricao,
      ),
    )
  }

  for (const ex of pickKRandom(estabilidade, WARMUP_ESTABILIDADE)) {
    out.push(
      mountExercicio(
        ex,
        ordem++,
        { series: 2, reps: '30–45s', tempo_descanso: 30 },
        filtro,
        nomesRestricao,
      ),
    )
  }

  const gruposUnicos = [...new Set(gruposDoDia)]
  const aquecimentoPorGrupo = new Map<string, Exercicio[]>()
  for (const ex of catalogo) {
    if (ex.tipo !== 'aquecimento' || filtro.evitar.has(ex.id)) continue
    const arr = aquecimentoPorGrupo.get(ex.grupo_muscular) ?? []
    arr.push(ex)
    aquecimentoPorGrupo.set(ex.grupo_muscular, arr)
  }

  for (const grupo of gruposUnicos) {
    const [ex] = pickKRandom(aquecimentoPorGrupo.get(grupo) ?? [], WARMUP_AQUECIMENTO_POR_GRUPO)
    if (!ex) continue
    out.push(
      mountExercicio(ex, ordem++, { series: 2, reps: '10–15', tempo_descanso: 0 }, filtro, nomesRestricao),
    )
  }

  return out
}

const RECUPERACAO_MOBILIDADE = 4
const RECUPERACAO_CARDIO = 2

function montarRecuperacao(
  letra: string,
  nome: string,
  catalogo: Exercicio[],
  filtro: FiltroGeracao,
  prefsEq: string[],
  nomesRestricao: Map<number, string>,
): SessaoGerada {
  const exercicios: ExercicioGerado[] = []
  let ordem = 0

  // Mobilidade não é filtrada por equipamento (igual ao aquecimento);
  // o cardio respeita o que o usuário tem disponível.
  const mobilidade = catalogo.filter((e) => e.tipo === 'mobilidade' && !filtro.evitar.has(e.id))
  const cardio = catalogo.filter(
    (e) =>
      e.grupo_muscular === 'cardio' &&
      !filtro.evitar.has(e.id) &&
      equipamentosCompatível(e, prefsEq),
  )

  for (const ex of pickKRandom(mobilidade, RECUPERACAO_MOBILIDADE)) {
    exercicios.push(
      mountExercicio(ex, ordem++, { series: 1, reps: '8–10 cada', tempo_descanso: 0 }, filtro, nomesRestricao),
    )
  }
  for (const ex of pickKRandom(cardio, RECUPERACAO_CARDIO)) {
    exercicios.push(
      mountExercicio(ex, ordem++, { series: null, reps: '8–10 min leve', tempo_descanso: 0 }, filtro, nomesRestricao),
    )
  }

  return { letra, nome, exercicios }
}

export function alternativasExercicio(
  exercicioId: number,
  tipo: TipoExercicio,
  grupoMuscular: string,
  catalogo: Exercicio[],
  mapaContra: ExercicioRestricao[],
  restricoes: number[],
  equipamentos: string[],
  idsAtivosNaSessao: number[],
): Exercicio[] {
  const filtro = buildFiltro(restricoes, mapaContra)
  const ativos = new Set(idsAtivosNaSessao)
  const candidatos = catalogo.filter(
    (e) =>
      e.id !== exercicioId &&
      e.tipo === tipo &&
      e.grupo_muscular === grupoMuscular &&
      !filtro.evitar.has(e.id) &&
      equipamentosCompatível(e, equipamentos) &&
      !ativos.has(e.id),
  )
  return pickKRandom(candidatos, candidatos.length)
}

export function montarTreinoGerado(
  prefs: Pick<PreferenciaTreino, 'dias_semana' | 'objetivo' | 'nivel' | 'equipamentos' | 'restricoes'>,
  catalogo: Exercicio[],
  mapaContra: ExercicioRestricao[],
  nomesRestricao: Map<number, string>,
): SessaoGerada[] {
  const split = SPLIT_POR_DIAS[prefs.dias_semana?.length ?? 0]
  if (!split) throw new Error('Selecione ao menos 1 dia de treino para gerar a divisão.')
  const filtro = buildFiltro(prefs.restricoes, mapaContra)
  const pool = poolPorGrupo(catalogo, filtro, prefs.equipamentos)

  return split.sessoes.map((sessao) => {
    if (sessao.recuperacao) {
      return montarRecuperacao(
        sessao.letra,
        sessao.nome,
        catalogo,
        filtro,
        prefs.equipamentos,
        nomesRestricao,
      )
    }

    const gruposDoDia = Object.keys(sessao.grupos)
    let ordem = 0

    const aquecimento = montarAquecimento(gruposDoDia, catalogo, filtro, nomesRestricao)
    const pre = aquecimento.map((e) => ({ ...e, ordem: ordem++ }))

    const principais: ExercicioGerado[] = []
    for (const [grupo, count] of Object.entries(sessao.grupos)) {
      const escolhidos = escolher(pool, grupo, count)
      for (const ex of escolhidos) {
        const prescricao = prescrever(ex, prefs.objetivo, prefs.nivel)
        principais.push(mountExercicio(ex, ordem++, prescricao, filtro, nomesRestricao))
      }
    }

    return {
      letra: sessao.letra,
      nome: sessao.nome,
      exercicios: [...pre, ...principais],
    }
  })
}