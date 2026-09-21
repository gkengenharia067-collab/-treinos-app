-- ============================================================
-- 0007 · Soft-delete em sessao_exercicio (troca de exercício)
--
-- Trocar um exercício não apaga a linha antiga (o histórico de execucao
-- aponta para ela). Em vez disso marca ativo = false e insere uma nova
-- linha ativa. As telas consideram apenas ativo = true.
-- Idempotente.
-- ============================================================

alter table public.sessao_exercicio
  add column if not exists ativo boolean not null default true;

create index if not exists idx_sessao_exercicio_ativo
  on public.sessao_exercicio (sessao_id, ativo);

notify pgrst, 'reload schema';
