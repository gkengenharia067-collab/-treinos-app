-- ============================================================
-- Treina+ · Schema inicial (Fase 1 / MVP)
-- Multi-tenant por auth.uid() com RLS em todas as tabelas.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------
-- USUÁRIO (profile, espelha auth.users)
-- ------------------------------------------------------------------
create table public.usuario (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  -- A senha é gerenciada pelo Supabase Auth. A coluna existe para atender o modelo
  -- de dados e nunca recebe o hash manualmente.
  senha_hash text,
  data_nasc date,
  sexo text check (sexo in ('masculino', 'feminino')),
  altura_cm numeric(5, 1),
  -- 'pago' por enquanto. Sem uso funcional nesta fase (segmentação virá depois).
  plano text not null default 'pago' check (plano in ('basico', 'premium', 'pago')),
  avatar_url text,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- REFERENCIAIS (leitura pública para autenticados)
-- ------------------------------------------------------------------
create table public.restricao (
  id bigint primary key,
  nome text not null unique
);

create table public.exercicio (
  id bigint primary key,
  nome text not null,
  grupo_muscular text not null,
  tipo text not null check (tipo in ('forca', 'mobilidade', 'estabilidade', 'aquecimento')),
  equipamentos text[] not null default '{}'
);

create table public.exercicio_restricao (
  exercicio_id bigint not null references public.exercicio (id) on delete cascade,
  restricao_id bigint not null references public.restricao (id) on delete cascade,
  nivel text not null check (nivel in ('evitar', 'cautela')),
  primary key (exercicio_id, restricao_id)
);

-- ------------------------------------------------------------------
-- PREFERÊNCIA DE TREINO (1:1 com usuário)
-- ------------------------------------------------------------------
create table public.preferencia_treino (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null unique references public.usuario (id) on delete cascade,
  divisao text not null check (divisao in ('ABCD', 'ABC', 'AB', 'FullBody')),
  objetivo text not null check (objetivo in ('hipertrofia', 'definicao', 'forca', 'resistencia')),
  nivel text not null check (nivel in ('iniciante', 'intermediario', 'avancado')),
  dias_semana int[] not null default '{}',
  equipamentos text[] not null default '{}',
  restricoes bigint[] not null default '{}',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- TREINO (versões)
-- ------------------------------------------------------------------
create table public.treino (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuario (id) on delete cascade,
  nome text not null,
  divisao text not null,
  objetivo text not null,
  nivel text not null,
  versao int not null default 1,
  status text not null default 'ativo' check (status in ('ativo', 'arquivado')),
  criado_em timestamptz not null default now(),
  arquivado_em timestamptz
);

create table public.sessao_treino (
  id uuid primary key default uuid_generate_v4(),
  treino_id uuid not null references public.treino (id) on delete cascade,
  letra text not null,
  nome text not null
);

create table public.sessao_exercicio (
  id uuid primary key default uuid_generate_v4(),
  sessao_id uuid not null references public.sessao_treino (id) on delete cascade,
  exercicio_id bigint not null references public.exercicio (id),
  ordem int not null default 0,
  tipo text not null default 'forca' check (tipo in ('forca', 'mobilidade', 'estabilidade', 'aquecimento')),
  series int,
  reps_min int,
  reps_max int,
  -- Exibição textual p/ exercícios de tempo/ritmo ("30s cada lado", "10/lado")
  reps text,
  carga numeric(6, 2),
  tempo_descanso int,
  obs text,
  metodo_progressao text check (metodo_progressao in ('linear', 'double_progression', 'rpe')),
  rpe_alvo int
);

-- ------------------------------------------------------------------
-- EXECUÇÃO (registro por exercício por sessão treinada)
-- ------------------------------------------------------------------
create table public.execucao (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuario (id) on delete cascade,
  sessao_exercicio_id uuid not null references public.sessao_exercicio (id) on delete cascade,
  data timestamptz not null default now(),
  series_feitas int,
  reps_feitas int,
  carga_usada numeric(6, 2),
  rpe int,
  obs text,
  concluido boolean not null default false
);

-- ------------------------------------------------------------------
-- MEDIDAS CORPORAIS
-- ------------------------------------------------------------------
create table public.medida (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuario (id) on delete cascade,
  data timestamptz not null default now(),
  peso_kg numeric(5, 2),
  altura_cm numeric(5, 1),
  cintura numeric(5, 1),
  quadril numeric(5, 1),
  abdomen numeric(5, 1),
  torax numeric(5, 1),
  braco_d numeric(5, 1),
  braco_e numeric(5, 1),
  coxa_d numeric(5, 1),
  coxa_e numeric(5, 1),
  panturrilha_d numeric(5, 1),
  panturrilha_e numeric(5, 1),
  ombro numeric(5, 1),
  pescoco numeric(5, 1)
);

create table public.dobra_cutanea (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuario (id) on delete cascade,
  data timestamptz not null default now(),
  triceps numeric(5, 1),
  subescapular numeric(5, 1),
  suprailiaca numeric(5, 1),
  biceps numeric(5, 1),
  peitoral numeric(5, 1),
  axilar_media numeric(5, 1),
  coxa numeric(5, 1),
  abdomen numeric(5, 1)
);

-- ------------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------------
create index idx_pref_usuario on public.preferencia_treino (usuario_id);
create index idx_treino_usuario on public.treino (usuario_id);
create index idx_sessao_treino on public.sessao_treino (treino_id);
create index idx_sessao_exercicio on public.sessao_exercicio (sessao_id, ordem);
create index idx_execucao_seid on public.execucao (sessao_exercicio_id, data desc);
create index idx_execucao_usuario on public.execucao (usuario_id);
create index idx_medida_usuario on public.medida (usuario_id, data);
create index idx_dobra_usuario on public.dobra_cutanea (usuario_id, data);

-- ------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------------
alter table public.usuario enable row level security;
alter table public.preferencia_treino enable row level security;
alter table public.restricao enable row level security;
alter table public.exercicio enable row level security;
alter table public.exercicio_restricao enable row level security;
alter table public.treino enable row level security;
alter table public.sessao_treino enable row level security;
alter table public.sessao_exercicio enable row level security;
alter table public.execucao enable row level security;
alter table public.medida enable row level security;
alter table public.dobra_cutanea enable row level security;

-- Referenciais: leitura aberta (catálogo/catálogo de restrições não são dados do usuário)
create policy "restricao_select" on public.restricao
  for select to public using (true);
create policy "exercicio_select" on public.exercicio
  for select to public using (true);
create policy "exercicio_restricao_select" on public.exercicio_restricao
  for select to public using (true);

-- usuario: somente o próprio perfil
create policy "usuario_select_own" on public.usuario
  for select to authenticated using (id = auth.uid());
create policy "usuario_insert_own" on public.usuario
  for insert to authenticated with check (id = auth.uid());
create policy "usuario_update_own" on public.usuario
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Demais tabelas: isolamento por usuario_id
create policy "preferencia_all_own" on public.preferencia_treino
  for all to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy "treino_all_own" on public.treino
  for all to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy "sessao_through_treino" on public.sessao_treino
  for all to authenticated
  using (exists (
    select 1 from public.treino t
    where t.id = sessao_treino.treino_id and t.usuario_id = auth.uid()))
  with check (exists (
    select 1 from public.treino t
    where t.id = sessao_treino.treino_id and t.usuario_id = auth.uid()));

create policy "sessao_exercicio_through_treino" on public.sessao_exercicio
  for all to authenticated
  using (exists (
    select 1 from public.sessao_treino st
    join public.treino t on t.id = st.treino_id
    where st.id = sessao_exercicio.sessao_id and t.usuario_id = auth.uid()))
  with check (exists (
    select 1 from public.sessao_treino st
    join public.treino t on t.id = st.treino_id
    where st.id = sessao_exercicio.sessao_id and t.usuario_id = auth.uid()));

create policy "execucao_all_own" on public.execucao
  for all to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy "medida_all_own" on public.medida
  for all to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy "dobra_all_own" on public.dobra_cutanea
  for all to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- ------------------------------------------------------------------
-- AVATARES (Storage) — pasta própria por usuário
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

create policy "avatares_pub_read" on storage.objects
  for select using (bucket_id = 'avatares');

create policy "avatares_insert_own" on storage.objects
  for insert with check (bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatares_update_own" on storage.objects
  for update using (bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatares_delete_own" on storage.objects
  for delete using (bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------------
-- TRIGGER: cria linha em usuario automaticamente no sign-up
-- ------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuario (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', 'Atleta'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();