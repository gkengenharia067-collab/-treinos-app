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

export const DIVISOES: Record<
  Divisao,
  { label: string; desc: string; sessoes: SessionTemplate[]; diasNecessarios: number }
> = {
  ABCD: {
    label: 'ABCD',
    desc: '4 treinos na semana',
    diasNecessarios: 4,
    sessoes: [
      { letra: 'A', nome: 'Peito · Bíceps', grupos: { peito: 3, biceps: 2 } },
      { letra: 'B', nome: 'Costas · Tríceps', grupos: { costas: 3, triceps: 2 } },
      { letra: 'C', nome: 'Pernas', grupos: { quadriceps: 2, posterior: 1, gluteos: 1, panturrilha: 1, core: 1 } },
      { letra: 'D', nome: 'Ombros · Abdômen', grupos: { ombros: 3, core: 2 } },
    ],
  },
  ABC: {
    label: 'ABC',
    desc: '3 treinos na semana',
    diasNecessarios: 3,
    sessoes: [
      { letra: 'A', nome: 'Peito · Tríceps', grupos: { peito: 3, triceps: 2 } },
      { letra: 'B', nome: 'Costas · Bíceps', grupos: { costas: 3, biceps: 2 } },
      { letra: 'C', nome: 'Pernas · Ombros', grupos: { quadriceps: 2, posterior: 1, gluteos: 1, panturrilha: 1, ombros: 2, core: 2 } },
    ],
  },
  AB: {
    label: 'AB',
    desc: '2 treinos na semana',
    diasNecessarios: 2,
    sessoes: [
      { letra: 'A', nome: 'Superiores', grupos: { peito: 2, costas: 2, ombros: 1, biceps: 1, triceps: 1 } },
      { letra: 'B', nome: 'Inferiores', grupos: { quadriceps: 2, posterior: 1, gluteos: 1, panturrilha: 1, core: 1 } },
    ],
  },
  FullBody: {
    label: 'Full Body',
    desc: 'Corpo inteiro · 3x na semana',
    diasNecessarios: 3,
    sessoes: [
      { letra: 'A', nome: 'Full Body', grupos: { peito: 1, costas: 1, quadriceps: 1, posterior: 1, ombros: 1, biceps: 1, triceps: 1, core: 1 } },
      { letra: 'B', nome: 'Full Body', grupos: { peito: 1, costas: 1, quadriceps: 1, posterior: 1, ombros: 1, biceps: 1, triceps: 1, core: 1 } },
      { letra: 'C', nome: 'Full Body', grupos: { peito: 1, costas: 1, quadriceps: 1, posterior: 1, ombros: 1, biceps: 1, triceps: 1, core: 1 } },
    ],
  },
}

export interface SessionTemplate {
  letra: string
  nome: string
  grupos: Record<string, number>
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
  ABCD: 'ABCD',
  ABC: 'ABC',
  AB: 'AB',
  FullBody: 'Full Body',
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
  mobilidade: 'Mobilidade',
  estabilidade: 'Estabilidade',
}