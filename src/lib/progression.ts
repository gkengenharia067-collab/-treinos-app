import type { MetodoProgressao } from './types'

export interface Prescricao {
  series: number
  repsMin: number
  repsMax: number
  metodo: MetodoProgressao | null
  rpeAlvo?: number | null
}

export interface UltimaExecucao {
  series_feitas?: number | null
  reps_feitas?: number | null
  carga_usada?: number | null
  rpe?: number | null
  concluido?: boolean
}

export interface SugestaoProgressao {
  acao: 'iniciar' | 'manter' | 'subir' | 'reduzir'
  motivo: string
  proximaCarga?: number
}

function num(v: number | null | undefined): number {
  return v == null ? 0 : v
}

export function incrementoCarga(carga: number): number {
  const c = Math.abs(carga)
  if (c < 15) return 2.5
  if (c < 60) return 5
  return 10
}

export function sugerirProgressao(
  p: Prescricao,
  ultima: UltimaExecucao | null,
): SugestaoProgressao {
  const metodo = p.metodo ?? 'linear'

  if (
    !ultima ||
    ultima.carga_usada == null ||
    (ultima.concluido == null && ultima.series_feitas == null && ultima.reps_feitas == null && ultima.rpe == null)
  ) {
    return {
      acao: 'iniciar',
      motivo: 'Primeira execução: escolha uma carga que permita completar a faixa proposta.',
    }
  }

  const carga = num(ultima.carga_usada)
  const seriesOk = ultima.concluido === true || (ultima.series_feitas ?? 0) >= p.series
  const rep = num(ultima.reps_feitas)
  const incremento = incrementoCarga(carga)

  if (metodo === 'linear') {
    // completou tudo prescrito -> sobe sempre
    if (seriesOk) {
      const progresso = rep >= p.repsMax ? incremento * 2 : incremento
      return {
        acao: 'subir',
        motivo:
          rep >= p.repsMax
            ? `Você fez ${rep} reps (teto da faixa). Suba ${progresso} kg e siga tentando a faixa de ${p.repsMin}–${p.repsMax}.`
            : `Você completou as ${p.series} séries prescritas. Suba ${progresso} kg mantendo a faixa de ${p.repsMin}–${p.repsMax} reps.`,
        proximaCarga: Math.round((carga + progresso) * 10) / 10,
      }
    }
    return {
      acao: 'manter',
      motivo: `Você ainda não completou as ${p.series} séries prescritas. Mantenha a carga de ${carga} kg e repita.`,
      proximaCarga: carga,
    }
  }

  if (metodo === 'double_progression') {
    // mantém carga até bater o teto da faixa em todas as séries
    if (seriesOk && rep >= p.repsMax) {
      return {
        acao: 'subir',
        motivo: `Você bateu o teto (${p.repsMax} reps). Suba ${incremento} kg e recomece na base da faixa (${p.repsMin} reps).`,
        proximaCarga: Math.round((carga + incremento) * 10) / 10,
      }
    }
    return {
      acao: 'manter',
      motivo: `Mantenha ${carga} kg até bater ${p.repsMax} reps em todas as séries. Atualmente você fez ${rep} reps (faixa ${p.repsMin}–${p.repsMax}).`,
      proximaCarga: carga,
    }
  }

  // rpe / autorregulação
  const alvo = p.rpeAlvo ?? 8
  const rpeRelatado = ultima.rpe
  if (rpeRelatado == null) {
    return {
      acao: 'manter',
      motivo: `Anote o RPE após cada série (alvo ${alvo}). Mantenha a carga até ter dados.`,
      proximaCarga: carga,
    }
  }
  if (rpeRelatado < alvo) {
    return {
      acao: 'subir',
      motivo: `RPE ${rpeRelatado} abaixo do alvo (${alvo}) — o movimento estava fácil. Suba ${incremento} kg.`,
      proximaCarga: Math.round((carga + incremento) * 10) / 10,
    }
  }
  if (rpeRelatado > alvo + 1) {
    return {
      acao: 'reduzir',
      motivo: `RPE ${rpeRelatado} bem acima do alvo (${alvo}). Reduza ${incremento} kg para controlar o esforço.`,
      proximaCarga: Math.max(0, Math.round((carga - incremento) * 10) / 10),
    }
  }
  return {
    acao: 'manter',
    motivo: `RPE ${rpeRelatado} dentro do alvo (${alvo}). Mantenha ${carga} kg.`,
    proximaCarga: carga,
  }
}

export function cargaSugerida(u: Prescricao, ultima: UltimaExecucao | null): number | null {
  const s = sugerirProgressao(u, ultima)
  return s.proximaCarga ?? null
}

export function progressoPeso(anterior: UltimaExecucao | null, atual: UltimaExecucao | null): number | null {
  if (!anterior && !atual) return null
  const a = (anterior?.carga_usada ?? null) as number | null
  const b = (atual?.carga_usada ?? null) as number | null
  if (a == null || b == null) return null
  return b - a
}