export type Sexo = 'masculino' | 'feminino'
export type Plano = 'pago' | 'basico' | 'premium'
export type Divisao = 'FullBody' | 'AB' | 'ABC' | 'ABCD' | 'ABCDE' | 'ABCDEF' | 'ABCDEFG'
export type Objetivo = 'hipertrofia' | 'definicao' | 'forca' | 'resistencia'
export type Nivel = 'iniciante' | 'intermediario' | 'avancado'
export type TipoExercicio = 'forca' | 'mobilidade' | 'estabilidade' | 'aquecimento'
export type MetodoProgressao = 'linear' | 'double_progression' | 'rpe'
export type StatusTreino = 'ativo' | 'arquivado'

export interface Usuario {
  id: string
  nome: string
  email: string
  senha_hash?: string | null
  data_nasc?: string | null
  sexo?: Sexo | null
  altura_cm?: number | null
  plano: Plano
  avatar_url?: string | null
  criado_em: string
}

export interface PreferenciaTreino {
  id: string
  usuario_id: string
  divisao: Divisao
  objetivo: Objetivo
  nivel: Nivel
  dias_semana: number[]
  equipamentos: string[]
  restricoes: number[]
  criado_em?: string
  atualizado_em?: string
}

export interface Restricao {
  id: number
  nome: string
}

export interface Exercicio {
  id: number
  nome: string
  grupo_muscular: string
  tipo: TipoExercicio
  equipamentos: string[]
}

export interface ExercicioRestricao {
  exercicio_id: number
  restricao_id: number
  nivel: 'evitar' | 'cautela'
}

export interface Treino {
  id: string
  usuario_id: string
  nome: string
  divisao: Divisao
  objetivo: Objetivo
  nivel: Nivel
  versao: number
  status: StatusTreino
  criado_em: string
  arquivado_em?: string | null
}

export interface SessaoTreino {
  id: string
  treino_id: string
  letra: string
  nome: string
}

export interface SessaoExercicio {
  id: string
  sessao_id: string
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
  metodo_progressao?: MetodoProgressao | null
  rpe_alvo?: number | null
}

export interface SessaoExercicioCompleta extends SessaoExercicio {
  exercicio: Exercicio | null
}

export interface Execucao {
  id: string
  usuario_id: string
  sessao_exercicio_id: string
  data: string
  series_feitas?: number | null
  reps_feitas?: number | null
  carga_usada?: number | null
  rpe?: number | null
  obs?: string | null
  concluido: boolean
}

export interface Medida {
  id: string
  usuario_id: string
  data: string
  peso_kg?: number | null
  altura_cm?: number | null
  cintura?: number | null
  quadril?: number | null
  abdomen?: number | null
  torax?: number | null
  braco_d?: number | null
  braco_e?: number | null
  coxa_d?: number | null
  coxa_e?: number | null
  panturrilha_d?: number | null
  panturrilha_e?: number | null
  ombro?: number | null
  pescoco?: number | null
}

export interface DobraCutanea {
  id: string
  usuario_id: string
  data: string
  triceps?: number | null
  subescapular?: number | null
  suprailiaca?: number | null
  biceps?: number | null
  peitoral?: number | null
  axilar_media?: number | null
  coxa?: number | null
  abdomen?: number | null
}

export interface TreinoCompleto extends Treino {
  sessoes: SessaoTreinoCompleta[]
}

export interface SessaoTreinoCompleta extends SessaoTreino {
  exercicios: SessaoExercicioCompleta[]
}
