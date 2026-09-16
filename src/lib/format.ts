export function fmtNum(v: number | null | undefined, decimais = 1): string {
  if (v == null || Number.isNaN(v)) return '—'
  return v.toLocaleString('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  })
}

export function fmtInt(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—'
  return v.toLocaleString('pt-BR')
}

export function fmtData(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDataCurta(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function diasDaSemana(numeros: number[]): string {
  const nomes: Record<number, string> = {
    1: 'Seg',
    2: 'Ter',
    3: 'Qua',
    4: 'Qui',
    5: 'Sex',
    6: 'Sáb',
    7: 'Dom',
  }
  if (!numeros?.length) return '—'
  return numeros
    .slice()
    .sort((a, b) => a - b)
    .map((n) => nomes[n] ?? n.toString())
    .join(', ')
}

export function idadeDe(nascimento?: string | null): number | null {
  if (!nascimento) return null
  const nasc = new Date(nascimento)
  if (Number.isNaN(nasc.getTime())) return null
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}