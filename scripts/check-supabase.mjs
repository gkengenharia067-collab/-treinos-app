import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const txt = readFileSync('.env', 'utf8')
const env = Object.fromEntries(
  txt
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1)]
    }),
)

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
let falhas = 0

const esperado = (nome, ok, detalhe) => {
  if (!ok) falhas++
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${nome}${detalhe ? ` -> ${detalhe}` : ''}`)
}

const contagem = async (tabela) => {
  const r = await sb.from(tabela).select('*', { count: 'exact', head: true })
  return { count: r.count, erro: r.error?.message ?? null }
}

const ex = await contagem('exercicio')
esperado('catalogo exercicio (116)', ex.count === 116, `count=${ex.count} erro=${ex.erro}`)

const re = await contagem('restricao')
esperado('restricao (7)', re.count === 7, `count=${re.count} erro=${re.erro}`)

const er = await contagem('exercicio_restricao')
esperado('exercicio_restricao (131)', er.count === 131, `count=${er.count} erro=${er.erro}`)

const fn = await sb.rpc('gerar_treino', {
  p_nome: 'x',
  p_divisao: 'ABC',
  p_objetivo: 'hipertrofia',
  p_nivel: 'iniciante',
  p_versao: 0,
  p_exercicios: [],
})
esperado(
  'gerar_treino bloqueada para anon',
  /permission denied/i.test(fn.error?.message ?? ''),
  fn.error?.message,
)

// Sem head: aqui o corpo traz a mensagem de erro (com head o supabase-js a omite).
const pref = await sb.from('preferencia_treino').select('*')
const prefBloqueado =
  /permission denied/i.test(pref.error?.message ?? '') || pref.status === 401
esperado('preferencia_treino inacessivel ao anon', prefBloqueado, `status=${pref.status} ${pref.error?.message ?? ''}`)

// Bucket: getBucket() exige credencial privilegiada, então validamos por
// comportamento (listar + URL pública), que é o que o app realmente usa.
const list = await sb.storage.from('avatares').list()
esperado('bucket avatares acessivel (list)', !list.error, list.error?.message ?? 'lista vazia')

const probe = await fetch(
  env.VITE_SUPABASE_URL + '/storage/v1/object/public/avatares/__probe_inexistente__.txt',
)
const corpo = await probe.json().catch(() => ({}))
esperado(
  'bucket avatares publico',
  !/bucket/i.test(corpo.message ?? '') && /not_found|NoSuchKey/i.test(corpo.code ?? ''),
  `http=${probe.status} ${corpo.message ?? ''}`,
)

console.log(falhas === 0 ? '\nTUDO OK' : `\n${falhas} verificacao(oes) falharam`)
process.exit(falhas === 0 ? 0 : 1)