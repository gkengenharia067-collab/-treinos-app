import {
  cmb,
  imc,
  massaGorda,
  massaMagra,
  pollock3,
  rcq,
  usNavyBodyFat,
} from './calculations'
import { idadeDe } from './format'
import type { DobraCutanea, Medida, Sexo, Usuario } from './types'

export interface MetricasCorporais {
  peso: number | null
  imc: number | null
  pctGorduraNavy: number | null
  pctGorduraPollock: number | null
  pctGordura: number | null
  massaGorda: number | null
  massaMagra: number | null
  rcq: number | null
  cmb: number | null
  bracoMedio: number | null
  coxaMedia: number | null
  panturrilhaMedia: number | null
  quadrilMedia: number | null
}

function media(a?: number | null, b?: number | null): number | null {
  const valores = [a, b].filter((v): v is number => v != null)
  if (!valores.length) return null
  return valores.reduce((s, v) => s + v, 0) / valores.length
}

export function calcularMetricas(
  medida: Medida | null,
  dobra: DobraCutanea | null,
  perfil: Pick<Usuario, 'sexo' | 'data_nasc' | 'altura_cm'> | null,
): MetricasCorporais {
  const peso = medida?.peso_kg ?? null
  const altura = medida?.altura_cm ?? perfil?.altura_cm ?? null
  const sexo = perfil?.sexo ?? null
  const idade = idadeDe(perfil?.data_nasc) ?? 30

  const vazio: MetricasCorporais = {
    peso,
    imc: peso && altura ? imc(peso, altura) : null,
    pctGorduraNavy: null,
    pctGorduraPollock: null,
    pctGordura: null,
    massaGorda: null,
    massaMagra: null,
    rcq: medida?.cintura && medida?.quadril ? rcq(medida.cintura, medida.quadril) : null,
    cmb: medida?.braco_d && dobra?.triceps ? cmb(medida.braco_d, dobra.triceps) : null,
    bracoMedio: media(medida?.braco_d, medida?.braco_e),
    coxaMedia: media(medida?.coxa_d, medida?.coxa_e),
    panturrilhaMedia: media(medida?.panturrilha_d, medida?.panturrilha_e),
    quadrilMedia: medida?.quadril ?? null,
  }

  if (!sexo || !altura) return vazio

  if (medida?.pescoco && medida?.cintura) {
    vazio.pctGorduraNavy = usNavyBodyFat(
      sexo as Sexo,
      altura,
      medida.pescoco,
      medida.cintura,
      medida.quadril ?? undefined,
    )
  }

  if (dobra) {
    vazio.pctGorduraPollock = pollock3(
      sexo as Sexo,
      idade,
      dobra.peitoral ?? undefined,
      dobra.abdomen ?? undefined,
      dobra.triceps ?? undefined,
      dobra.suprailiaca ?? undefined,
      dobra.coxa ?? undefined,
    )
  }

  const pct = vazio.pctGorduraPollock ?? vazio.pctGorduraNavy
  vazio.pctGordura = pct
  if (peso != null && pct != null) {
    vazio.massaGorda = massaGorda(peso, pct)
    vazio.massaMagra = massaMagra(peso, pct)
  }

  return vazio
}