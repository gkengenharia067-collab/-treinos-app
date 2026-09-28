-- ============================================================
-- 0009 · Dados da balança inteligente (bioimpedância)
--
-- Adiciona colunas OPÇIONAIS em public.medida para guardar as
-- leituras diretas de uma balança de bioimpedância, permitindo
-- no app comparar o cálculo (US Navy / Pollock) com a balança.
--
-- RLS: as políticas de public.medida (medida_all_own) restringem
-- por linha (usuario_id = auth.uid()), valem para a tabela inteira
-- e, portanto, cobrem automaticamente as novas colunas — nenhuma
-- política ou GRANT precisa ser alterado.
-- Idempotente.
-- ============================================================

alter table public.medida
  add column if not exists gordura_balanca numeric(5, 2),
  add column if not exists massa_magra_balanca numeric(6, 2),
  add column if not exists agua_corporal numeric(5, 2),
  add column if not exists massa_ossea numeric(6, 2);

comment on column public.medida.gordura_balanca is 'Percentual de gordura corporal lido pela balança (%)';
comment on column public.medida.massa_magra_balanca is 'Massa magra (FFM) lida pela balança (kg)';
comment on column public.medida.agua_corporal is 'Água corporal total lida pela balança (%)';
comment on column public.medida.massa_ossea is 'Massa óssea lida pela balança (kg)';