import { createSupabaseError, supabase } from './supabase'
import { divisaoPorDias } from './constants'
import { montarTreinoGerado } from './generator'
import type {
  DobraCutanea,
  Execucao,
  Exercicio,
  ExercicioRestricao,
  Medida,
  PreferenciaTreino,
  Restricao,
  SessaoExercicio,
  SessaoTreino,
  Treino,
} from './types'

export interface CatalogoDisponivel {
  catalogo: Exercicio[]
  mapaContra: ExercicioRestricao[]
  restricoes: Restricao[]
}

export interface TreinoDetalhado extends Treino {
  sessoes: Array<
    SessaoTreino & { exercicios: Array<SessaoExercicio & { exercicio: Exercicio | null }> }
  >
}

export interface SessaoPublica extends SessaoTreino {
  exercicios: Array<SessaoExercicio & { exercicio: Exercicio | null }>
}

export interface ExecucaoDetalhada extends Execucao {
  sessao_exercicio: { exercicio: { nome: string } | null } | null
}

function erro(err: unknown): Error {
  return new Error(createSupabaseError(err))
}

export function precisaDeSupabase(): void {
  if (!supabase) {
    throw new Error('Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
  }
}

export async function carregarCatalogo(): Promise<CatalogoDisponivel> {
  precisaDeSupabase()
  const supabaseLocal = supabase!
  const [ex, contra, rest] = await Promise.all([
    supabaseLocal.from('exercicio').select('*').order('id'),
    supabaseLocal.from('exercicio_restricao').select('*'),
    supabaseLocal.from('restricao').select('*').order('id'),
  ])
  if (ex.error) throw erro(ex.error)
  if (contra.error) throw erro(contra.error)
  if (rest.error) throw erro(rest.error)
  return {
    catalogo: ex.data as Exercicio[],
    mapaContra: contra.data as ExercicioRestricao[],
    restricoes: rest.data as Restricao[],
  }
}

export async function carregarPreferencia(usuarioId: string): Promise<PreferenciaTreino | null> {
  precisaDeSupabase()
  const { data, error } = await supabase!
    .from('preferencia_treino')
    .select('*')
    .eq('usuario_id', usuarioId)
    .maybeSingle()
  if (error) throw erro(error)
  return (data as PreferenciaTreino | null) ?? null
}

export async function salvarPreferencia(usuarioId: string, campos: Partial<PreferenciaTreino>): Promise<void> {
  precisaDeSupabase()
  const supabaseL = supabase!
  const existente = await carregarPreferencia(usuarioId)
  const payload = {
    usuario_id: usuarioId,
    divisao: campos.divisao!,
    objetivo: campos.objetivo!,
    nivel: campos.nivel!,
    dias_semana: campos.dias_semana ?? [],
    equipamentos: campos.equipamentos ?? [],
    restricoes: campos.restricoes ?? [],
  }
  if (existente) {
    const { error } = await supabaseL
      .from('preferencia_treino')
      .update({ ...payload, atualizado_em: new Date().toISOString() })
      .eq('usuario_id', usuarioId)
    if (error) throw erro(error)
  } else {
    const { error } = await supabaseL.from('preferencia_treino').insert(payload)
    if (error) throw erro(error)
  }
}

export interface ArgsGerarTreino {
  usuarioId: string
  preferencia: Pick<
    PreferenciaTreino,
    'divisao' | 'dias_semana' | 'objetivo' | 'nivel' | 'equipamentos' | 'restricoes'
  >
  catalogo: CatalogoDisponivel
  versao: number
  nome: string
  arquivar?: string | null
}

export async function gerarTreino(args: ArgsGerarTreino): Promise<string> {
  precisaDeSupabase()
  const nomes = new Map<number, string>()
  for (const r of args.catalogo.restricoes) nomes.set(r.id, r.nome)

  const sessoes = montarTreinoGerado(
    args.preferencia,
    args.catalogo.catalogo,
    args.catalogo.mapaContra,
    nomes,
  )

  // treino.divisao guarda o resultado calculado a partir dos dias escolhidos.
  const divisao = divisaoPorDias(args.preferencia.dias_semana) ?? args.preferencia.divisao

  const { data, error } = await supabase!.rpc('gerar_treino', {
    p_nome: args.nome,
    p_divisao: divisao,
    p_objetivo: args.preferencia.objetivo,
    p_nivel: args.preferencia.nivel,
    p_versao: args.versao,
    p_exercicios: sessoes,
    p_arquivar: args.arquivar ?? null,
  })
  if (error) throw erro(error)
  void args.usuarioId
  return data as string
}

export async function listarTreinosCompletos(usuarioId: string): Promise<TreinoDetalhado[]> {
  precisaDeSupabase()
  const { data, error } = await supabase!
    .from('treino')
    .select(
      '*, sessoes:sessao_treino(*, exercicios:sessao_exercicio(*, exercicio(*)))',
    )
    .eq('usuario_id', usuarioId)
    .order('criado_em', { ascending: false })
  if (error) throw erro(error)
  return (data as TreinoDetalhado[]) ?? []
}

export async function carregarSessaoCompleta(sessaoId: string): Promise<SessaoPublica | null> {
  precisaDeSupabase()
  const { data, error } = await supabase!
    .from('sessao_treino')
    .select('*, exercicios:sessao_exercicio(*, exercicio(*))')
    .eq('id', sessaoId)
    .order('ordem', { referencedTable: 'exercicios', ascending: true })
    .maybeSingle()
  if (error) throw erro(error)
  return (data as SessaoPublica | null) ?? null
}

export async function buscarTreinoPorSessao(sessaoId: string): Promise<Treino | null> {
  precisaDeSupabase()
  const { data: sessao, error: e1 } = await supabase!
    .from('sessao_treino')
    .select('treino_id')
    .eq('id', sessaoId)
    .maybeSingle()
  if (e1) throw erro(e1)
  if (!sessao) return null
  const { data: treino, error } = await supabase!
    .from('treino')
    .select('*')
    .eq('id', sessao.treino_id as string)
    .maybeSingle()
  if (error) throw erro(error)
  return (treino as Treino | null) ?? null
}

export async function historicoExecucao(sessaoExercicioId: string): Promise<Execucao[]> {
  precisaDeSupabase()
  const { data, error } = await supabase!
    .from('execucao')
    .select('*')
    .eq('sessao_exercicio_id', sessaoExercicioId)
    .order('data', { ascending: true })
  if (error) throw erro(error)
  return (data as Execucao[]) ?? []
}

export async function historicoPorExercicios(ids: string[]): Promise<Execucao[]> {
  precisaDeSupabase()
  if (!ids.length) return []
  const { data, error } = await supabase!
    .from('execucao')
    .select('*')
    .in('sessao_exercicio_id', ids)
    .order('data', { ascending: true })
  if (error) throw erro(error)
  return (data as Execucao[]) ?? []
}

export async function inserirExecucao(usuarioId: string, entrada: Partial<Execucao>): Promise<void> {
  precisaDeSupabase()
  const { error } = await supabase!
    .from('execucao')
    .insert({
      usuario_id: usuarioId,
      sessao_exercicio_id: entrada.sessao_exercicio_id!,
      data: entrada.data ?? new Date().toISOString(),
      series_feitas: entrada.series_feitas ?? null,
      reps_feitas: entrada.reps_feitas ?? null,
      carga_usada: entrada.carga_usada ?? null,
      rpe: entrada.rpe ?? null,
      obs: entrada.obs ?? null,
      concluido: entrada.concluido ?? false,
    })
  if (error) throw erro(error)
}

export async function excluirExecucao(id: string): Promise<void> {
  precisaDeSupabase()
  const { error } = await supabase!.from('execucao').delete().eq('id', id)
  if (error) throw erro(error)
}

export async function listarMedidas(usuarioId: string): Promise<Medida[]> {
  precisaDeSupabase()
  const { data, error } = await supabase!
    .from('medida')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('data', { ascending: false })
  if (error) throw erro(error)
  return (data as Medida[]) ?? []
}

export async function listarExecucoesDetalhadas(usuarioId: string): Promise<ExecucaoDetalhada[]> {
  precisaDeSupabase()
  const { data, error } = await supabase!
    .from('execucao')
    .select('*, sessao_exercicio ( exercicio ( nome ) )')
    .eq('usuario_id', usuarioId)
    .order('data', { ascending: true })
  if (error) throw erro(error)
  return (data as ExecucaoDetalhada[]) ?? []
}

export async function listarDobras(usuarioId: string): Promise<DobraCutanea[]> {
  precisaDeSupabase()
  const { data, error } = await supabase!
    .from('dobra_cutanea')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('data', { ascending: false })
  if (error) throw erro(error)
  return (data as DobraCutanea[]) ?? []
}

export async function inserirMedida(usuarioId: string, medida: Partial<Medida>): Promise<string> {
  precisaDeSupabase()
  const { data, error } = await supabase!
    .from('medida')
    .insert({
      usuario_id: usuarioId,
      data: medida.data ?? new Date().toISOString(),
      peso_kg: medida.peso_kg ?? null,
      altura_cm: medida.altura_cm ?? null,
      cintura: medida.cintura ?? null,
      quadril: medida.quadril ?? null,
      abdomen: medida.abdomen ?? null,
      torax: medida.torax ?? null,
      braco_d: medida.braco_d ?? null,
      braco_e: medida.braco_e ?? null,
      coxa_d: medida.coxa_d ?? null,
      coxa_e: medida.coxa_e ?? null,
      panturrilha_d: medida.panturrilha_d ?? null,
      panturrilha_e: medida.panturrilha_e ?? null,
      ombro: medida.ombro ?? null,
      pescoco: medida.pescoco ?? null,
    })
    .select('id')
    .single()
  if (error) throw erro(error)
  return (data as { id: string }).id
}

export async function inserirDobra(usuarioId: string, dobra: Partial<DobraCutanea>): Promise<void> {
  precisaDeSupabase()
  const { error } = await supabase!
    .from('dobra_cutanea')
    .insert({
      usuario_id: usuarioId,
      data: dobra.data ?? new Date().toISOString(),
      triceps: dobra.triceps ?? null,
      subescapular: dobra.subescapular ?? null,
      suprailiaca: dobra.suprailiaca ?? null,
      biceps: dobra.biceps ?? null,
      peitoral: dobra.peitoral ?? null,
      axilar_media: dobra.axilar_media ?? null,
      coxa: dobra.coxa ?? null,
      abdomen: dobra.abdomen ?? null,
    })
  if (error) throw erro(error)
}