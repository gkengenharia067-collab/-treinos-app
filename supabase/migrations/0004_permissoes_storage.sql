-- ============================================================
-- 0004 · Permissões (GRANT) e bucket de Storage
-- Idempotente: seguro executar sobre um banco já migrado.
--
-- Corrige instalações em que as tabelas/funções existem, mas anon e
-- authenticated não receberam privilégios (o Supabase não concede mais
-- automaticamente para objetos criados via SQL). Sem os GRANTs, o
-- PostgREST responde "permission denied for table ...".
-- ============================================================

grant usage on schema public to anon, authenticated;

-- Catálogo: leitura aberta (inclusive anônimo, para o preview do wizard)
grant select on public.restricao, public.exercicio, public.exercicio_restricao
  to anon, authenticated;

-- Dados do usuário: apenas autenticado (o RLS isola por auth.uid())
grant select, insert, update, delete on public.usuario,
  public.preferencia_treino, public.treino, public.sessao_treino,
  public.sessao_exercicio, public.execucao, public.medida,
  public.dobra_cutanea
to authenticated;

-- RPC de geração de treino (já concedida no 0003; reaplicada por segurança)
grant execute on function public.gerar_treino(text, text, text, text, int, jsonb, uuid)
  to authenticated;

-- ------------------------------------------------------------------
-- Storage: bucket de avatares (se o INSERT falhar, crie manualmente:
-- Storage > New bucket > nome "avatares" > Public bucket = ON)
-- ------------------------------------------------------------------
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('avatares', 'avatares', true)
  on conflict (id) do nothing;
exception when insufficient_privilege then
  raise warning 'Sem permissão para criar o bucket via SQL. Crie manualmente em Storage > New bucket: nome "avatares", Public bucket = ON.';
end $$;

drop policy if exists "avatares_pub_read" on storage.objects;
create policy "avatares_pub_read" on storage.objects
  for select using (bucket_id = 'avatares');

drop policy if exists "avatares_insert_own" on storage.objects;
create policy "avatares_insert_own" on storage.objects
  for insert with check (bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatares_update_own" on storage.objects;
create policy "avatares_update_own" on storage.objects
  for update using (bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatares_delete_own" on storage.objects;
create policy "avatares_delete_own" on storage.objects
  for delete using (bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text);

-- Recarrega o cache de schema do PostgREST para reconhecer os GRANTs
notify pgrst, 'reload schema';
