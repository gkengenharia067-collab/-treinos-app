import type { Divisao, MetodoProgressao, Nivel, Objetivo } from './types'

export const DIAS_DISPONIVEIS = [
  { valor: 1, rotulo: 'Segunda' },
  { valor: 2, rotulo: 'Terça' },
  { valor: 3, rotulo: 'Quarta' },
  { valor: 4, rotulo: 'Quinta' },
  { valor: 5, rotulo: 'Sexta' },
  { valor: 6, rotulo: 'Sábado' },
  { valor: 7, rotulo: 'Domingo' },
]

export const OBJETIVOS: Record<
  Objetivo,
  { label: string; desc: string; seriesComp: number; seriesIso: number; repsMin: number; repsMax: number; restComp: number; restIso: number }
> = {
  hipertrofia: {
    label: 'Hipertrofia',
    desc: 'Volume e estímulo muscular',
    seriesComp: 4,
    seriesIso: 3,
    repsMin: 8,
    repsMax: 12,
    restComp: 90,
    restIso: 70,
  },
  definicao: {
    label: 'Definição',
    desc: 'Condicionamento e queima',
    seriesComp: 3,
    seriesIso: 3,
    repsMin: 12,
    repsMax: 15,
    restComp: 45,
    restIso: 35,
  },
  forca: {
    label: 'Força',
    desc: 'Cargas altas, reps baixas',
    seriesComp: 5,
    seriesIso: 4,
    repsMin: 3,
    repsMax: 6,
    restComp: 150,
    restIso: 90,
  },
  resistencia: {
    label: 'Resistência',
    desc: 'Reps altas, descanso curto',
    seriesComp: 3,
    seriesIso: 2,
    repsMin: 15,
    repsMax: 25,
    restComp: 30,
    restIso: 25,
  },
}

export interface SessionTemplate {
  letra: string
  nome: string
  grupos: Record<string, number>
  recuperacao?: boolean
}

// Divisão de 5 dias reaproveitada por 5/6/7 dias (6 e 7 só acrescentam sessões).
const SESSOES_5_DIAS: SessionTemplate[] = [
  { letra: 'A', nome: 'Costas · Bíceps', grupos: { costas: 3, biceps: 2 } },
  { letra: 'B', nome: 'Posterior de Pernas', grupos: { posterior: 2, gluteos: 2, panturrilha: 1, core: 1 } },
  { letra: 'C', nome: 'Peito · Tríceps', grupos: { peito: 3, triceps: 2 } },
  { letra: 'D', nome: 'Quadríceps', grupos: { quadriceps: 3, panturrilha: 1, core: 1 } },
  { letra: 'E', nome: 'Braços · Ombros', grupos: { biceps: 2, triceps: 2, ombros: 2, core: 1 } },
]

const SESSOES_6_DIAS: SessionTemplate[] = [
  ...SESSOES_5_DIAS,
  { letra: 'F', nome: 'Abdômen · Cardio', grupos: { core: 3, cardio: 2 } },
]

// A divisão é derivada da quantidade de dias escolhidos (não é mais perguntada).
export const SPLIT_POR_DIAS: Record<number, { chave: Divisao; sessoes: SessionTemplate[] }> = {
  1: {
    chave: 'FullBody',
    sessoes: [
      {
        letra: 'A',
        nome: 'Corpo inteiro',
        grupos: { peito: 1, costas: 1, quadriceps: 1, posterior: 1, ombros: 1, biceps: 1, triceps: 1, core: 1 },
      },
    ],
  },
  2: {
    chave: 'AB',
    sessoes: [
      { letra: 'A', nome: 'Superiores', grupos: { peito: 2, costas: 2, ombros: 1, biceps: 1, triceps: 1 } },
      { letra: 'B', nome: 'Inferiores', grupos: { quadriceps: 2, posterior: 1, gluteos: 1, panturrilha: 1, core: 1 } },
    ],
  },
  3: {
    chave: 'ABC',
    sessoes: [
      { letra: 'A', nome: 'Costas · Bíceps', grupos: { costas: 3, biceps: 2 } },
      { letra: 'B', nome: 'Peito · Tríceps', grupos: { peito: 3, triceps: 2 } },
      {
        letra: 'C',
        nome: 'Pernas · Ombros',
        grupos: { quadriceps: 2, posterior: 1, gluteos: 1, panturrilha: 1, ombros: 2, core: 2 },
      },
    ],
  },
  4: {
    chave: 'ABCD',
    sessoes: [
      { letra: 'A', nome: 'Costas · Bíceps', grupos: { costas: 3, biceps: 2 } },
      { letra: 'B', nome: 'Peito · Tríceps', grupos: { peito: 3, triceps: 2 } },
      { letra: 'C', nome: 'Pernas', grupos: { quadriceps: 2, posterior: 1, gluteos: 1, panturrilha: 1, core: 1 } },
      { letra: 'D', nome: 'Ombros · Abdômen', grupos: { ombros: 3, core: 2 } },
    ],
  },
  5: { chave: 'ABCDE', sessoes: SESSOES_5_DIAS },
  6: { chave: 'ABCDEF', sessoes: SESSOES_6_DIAS },
  7: {
    chave: 'ABCDEFG',
    sessoes: [
      ...SESSOES_6_DIAS,
      { letra: 'G', nome: 'Recuperação ativa', grupos: {}, recuperacao: true },
    ],
  },
}

export function divisaoPorDias(dias: number[]): Divisao | null {
  return SPLIT_POR_DIAS[dias.length]?.chave ?? null
}

export const NIVEIS: Record<Nivel, { label: string; desc: string; metodo: MetodoProgressao }> = {
  iniciante: { label: 'Iniciante', desc: 'Progressão linear', metodo: 'linear' },
  intermediario: { label: 'Intermediário', desc: 'Double progression', metodo: 'double_progression' },
  avancado: { label: 'Avançado', desc: 'Autorregulação por RPE', metodo: 'rpe' },
}

export const EQUIPAMENTOS = [
  { valor: 'academia', label: 'Academia' },
  { valor: 'halteres', label: 'Halteres/Dumbbells' },
  { valor: 'casa', label: 'Em casa' },
  { valor: 'peso_corpo', label: 'Peso corporal' },
]

export const GRUPOS_COMPOSTOS = new Set(['peito', 'costas', 'quadriceps', 'posterior', 'ombros'])

export const METODO_LABEL: Record<MetodoProgressao, string> = {
  linear: 'Progressão linear',
  double_progression: 'Double progression',
  rpe: 'Autorregulação (RPE)',
}

export const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia: 'Hipertrofia',
  definicao: 'Definição',
  forca: 'Força',
  resistencia: 'Resistência',
}

export const DIVISAO_LABEL: Record<Divisao, string> = {
  FullBody: 'Full Body',
  AB: 'AB',
  ABC: 'ABC',
  ABCD: 'ABCD',
  ABCDE: 'ABCDE',
  ABCDEF: 'ABCDEF',
  ABCDEFG: 'ABCDEFG',
}

export const GRUPO_LABEL: Record<string, string> = {
  peito: 'Peito',
  costas: 'Costas',
  quadriceps: 'Quadríceps',
  posterior: 'Posterior de coxa',
  gluteos: 'Glúteos',
  panturrilha: 'Panturrilha',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  core: 'Core',
  antebraco: 'Antebraço',
  cardio: 'Cardio',
  mobilidade: 'Mobilidade',
  estabilidade: 'Estabilidade',
}