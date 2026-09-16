// ------------------------------------------------------------------
// Cálculos corporais — Fase 1
// ------------------------------------------------------------------

export function imc(pesoKg: number, alturaCm: number): number | null {
  const h = alturaCm / 100
  if (!pesoKg || !alturaCm || h <= 0 || pesoKg <= 0) return null
  return pesoKg / (h * h)
}

export function imcCategoria(v: number): string {
  if (v < 18.5) return 'Abaixo do peso'
  if (v < 25) return 'Normal'
  if (v < 30) return 'Sobrepeso'
  if (v < 35) return 'Obesidade I'
  if (v < 40) return 'Obesidade II'
  return 'Obesidade III'
}

// ------------------------------------------------------------------
// US Navy / Marinha dos EUA — % gordura por fita métrica
// Fórmula oficial (medidas em polegadas -> conversão de cm automática)
// H: altura | P: pescoço | C: cintura | Q: quadril (mulheres)
// ------------------------------------------------------------------
export function usNavyBodyFat(
  sexo: 'masculino' | 'feminino',
  alturaCm: number,
  pescocoCm: number,
  cinturaCm: number,
  quadrilCm?: number,
): number | null {
  if (!alturaCm || !pescocoCm || !cinturaCm || pescocoCm <= 0) return null

  const H = alturaCm / 2.54
  const pes = pescocoCm / 2.54
  const cint = cinturaCm / 2.54

  if (sexo === 'masculino') {
    if (cint <= pes) return null
    return 495 / (1.0324 - 0.19077 * Math.log10(cint - pes) + 0.15456 * Math.log10(H)) - 450
  }

  if (!quadrilCm) return null
  const quad = quadrilCm / 2.54
  if (cint + quad <= pes) return null
  return 495 / (1.29579 - 0.35004 * Math.log10(cint + quad - pes) + 0.221 * Math.log10(H)) - 450
}

// ------------------------------------------------------------------
// Pollock 3 dobras (Jackson & Pollock) + Siri
// Masc: peitoral + abdomen + coxa | Fem: tríceps + suprailíaca + coxa
// (valores em mm)
// ------------------------------------------------------------------
export function pollockDensidade(
  sexo: 'masculino' | 'feminino',
  idade: number,
  soma: number,
): number | null {
  if (!soma || soma <= 0) return null
  if (sexo === 'masculino') {
    return (
      1.10938 -
      0.0008267 * soma +
      0.0000016 * soma * soma -
      0.0002574 * idade
    )
  }
  return (
    1.0994921 -
    0.0009929 * soma +
    0.0000023 * soma * soma -
    0.0001392 * idade
  )
}

export function siriBodyFat(densidade: number): number {
  return 495 / densidade - 450
}

export function pollock3(
  sexo: 'masculino' | 'feminino',
  idade: number,
  peitoralMm?: number,
  abdomenMm?: number,
  tricepsMm?: number,
  suprailiacaMm?: number,
  coxaMm?: number,
): number | null {
  let soma: number | null = null
  if (sexo === 'masculino') {
    if (peitoralMm != null && abdomenMm != null && coxaMm != null) {
      soma = peitoralMm + abdomenMm + coxaMm
    }
  } else {
    if (tricepsMm != null && suprailiacaMm != null && coxaMm != null) {
      soma = tricepsMm + suprailiacaMm + coxaMm
    }
  }
  if (soma == null) return null
  const d = pollockDensidade(sexo, idade, soma)
  if (d == null) return null
  return siriBodyFat(d)
}

export function massaGorda(pesoKg: number, pctGordura: number): number {
  return pesoKg * (pctGordura / 100)
}

export function massaMagra(pesoKg: number, pctGordura: number): number {
  return pesoKg - massaGorda(pesoKg, pctGordura)
}

// RCQ = cintura / quadril
export function rcq(cinturaCm: number, quadrilCm: number): number | null {
  if (!cinturaCm || !quadrilCm) return null
  return cinturaCm / quadrilCm
}

export function rcqCategory(sexo: 'masculino' | 'feminino', v: number): string {
  if (sexo === 'masculino') return v <= 0.9 ? 'Baixo risco' : 'Risco elevado'
  return v <= 0.85 ? 'Baixo risco' : 'Risco elevado'
}

// CMB = circunferência do braço (cm) - (π × DCT)
// DCT = dobra cutânea tricipital em cm
export function cmb(bracoCm: number, dctMm: number): number | null {
  if (!bracoCm || dctMm == null) return null
  const dctCm = dctMm / 10
  return bracoCm - Math.PI * dctCm
}

export function rounding(value: number, casas = 1): number {
  const f = Math.pow(10, casas)
  return Math.round(value * f) / f
}