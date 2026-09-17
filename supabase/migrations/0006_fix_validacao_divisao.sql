-- ============================================================
-- 0006 · Corrige a validação de divisão dentro da RPC gerar_treino
--
-- O 0005 ajustou apenas as constraints das tabelas. A função gerar_treino
-- (0003) ainda validava contra a lista antiga ('ABCD','ABC','AB','FullBody')
-- e lançava "Divisão inválida" para ABCDE/ABCDEF/ABCDEFG.
-- Recria a função com as 7 chaves. Idempotente.
-- ============================================================

create or replace function public.gerar_treino(
  p_nome text,
  p_divisao text,
  p_objetivo text,
  p_nivel text,
  p_versao int,
  p_exercicios jsonb,
  p_arquivar uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid := auth.uid();
  v_treino uuid;
  v_sessao uuid;
  s jsonb;
  e jsonb;
begin
  if v_usuario is null then
    raise exception 'Não autenticado';
  end if;

  if p_divisao not in ('FullBody', 'AB', 'ABC', 'ABCD', 'ABCDE', 'ABCDEF', 'ABCDEFG') then
    raise exception 'Divisão inválida: %', p_divisao;
  end if;

  if p_objetivo not in ('hipertrofia', 'definicao', 'forca', 'resistencia') then
    raise exception 'Objetivo inválido: %', p_objetivo;
  end if;

  if p_nivel not in ('iniciante', 'intermediario', 'avancado') then
    raise exception 'Nível inválido: %', p_nivel;
  end if;

  -- Arquiva o treino anterior (se informado e pertencente ao usuário)
  if p_arquivar is not null then
    update public.treino
       set status = 'arquivado',
           arquivado_em = now()
     where id = p_arquivar
       and usuario_id = v_usuario
       and status = 'ativo';
  end if;

  insert into public.treino (usuario_id, nome, divisao, objetivo, nivel, versao, status)
  values (v_usuario, p_nome, p_divisao, p_objetivo, p_nivel, p_versao, 'ativo')
  returning id into v_treino;

  for s in select * from jsonb_array_elements(p_exercicios) loop
    insert into public.sessao_treino (treino_id, letra, nome)
    values (v_treino, s ->> 'letra', s ->> 'nome')
    returning id into v_sessao;

    for e in select * from jsonb_array_elements(s -> 'exercicios') loop
      insert into public.sessao_exercicio (
        sessao_id, exercicio_id, ordem, tipo, series, reps_min, reps_max, reps,
        carga, tempo_descanso, obs, metodo_progressao, rpe_alvo
      ) values (
        v_sessao,
        (e ->> 'exercicio_id')::bigint,
        (e ->> 'ordem')::int,
        coalesce(e ->> 'tipo', 'forca'),
        nullif(e ->> 'series', '')::int,
        nullif(e ->> 'reps_min', '')::int,
        nullif(e ->> 'reps_max', '')::int,
        nullif(e ->> 'reps', ''),
        nullif(e ->> 'carga', '')::numeric,
        nullif(e ->> 'tempo_descanso', '')::int,
        nullif(e ->> 'obs', ''),
        nullif(e ->> 'metodo_progressao', ''),
        nullif(e ->> 'rpe_alvo', '')::int
      );
    end loop;
  end loop;

  return v_treino;
end;
$$;

revoke all on function public.gerar_treino(text, text, text, text, int, jsonb, uuid) from public;
grant execute on function public.gerar_treino(text, text, text, text, int, jsonb, uuid) to authenticated;

notify pgrst, 'reload schema';
