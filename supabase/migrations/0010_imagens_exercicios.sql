-- ============================================================
-- 0010 · Imagens dos exercícios (início / fim)
--
-- Adiciona as colunas imagem_url_inicio e imagem_url_fim na
-- tabela public.exercicio. Guardam o link da figura ilustrativa
-- da posição inicial/final do movimento — serão preenchidas no
-- futuro (Supabase Storage ou CDN) e exibidas na tela de execução.
--
-- RLS: a policy exercicio_select é de leitura aberta na tabela
-- inteira; as novas colunas ficam cobertas automaticamente.
-- Idempotente.
-- ============================================================

alter table public.exercicio
  add column if not exists imagem_url_inicio text,
  add column if not exists imagem_url_fim text;

comment on column public.exercicio.imagem_url_inicio is 'URL da imagem da posição inicial do exercício';
comment on column public.exercicio.imagem_url_fim is 'URL da imagem da posição final do exercício';