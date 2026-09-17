-- ============================================================
-- 0005 · Divisão calculada pelos dias + grupo de cardio
--
-- A divisão não é mais escolhida no wizard: passa a ser derivada da
-- quantidade de dias de treino (1–7). As chaves possíveis são:
--   FullBody, AB, ABC, ABCD, ABCDE, ABCDEF, ABCDEFG
-- Idempotente.
-- ============================================================

-- ------------------------------------------------------------------
-- 1) Relaxa/ajusta as constraints de divisão
-- ------------------------------------------------------------------
alter table public.preferencia_treino drop constraint if exists preferencia_treino_divisao_check;
alter table public.preferencia_treino add constraint preferencia_treino_divisao_check
  check (divisao in ('FullBody', 'AB', 'ABC', 'ABCD', 'ABCDE', 'ABCDEF', 'ABCDEFG'));

alter table public.treino drop constraint if exists treino_divisao_check;
alter table public.treino add constraint treino_divisao_check
  check (divisao in ('FullBody', 'AB', 'ABC', 'ABCD', 'ABCDE', 'ABCDEF', 'ABCDEFG'));

-- ------------------------------------------------------------------
-- 2) Exercícios de cardio (novo grupo_muscular = 'cardio')
-- Usados na sessão F (Abdômen · Cardio) e na recuperação ativa (dia 7).
-- Prescrição por duração, não por carga.
-- ------------------------------------------------------------------
insert into public.exercicio (id, nome, grupo_muscular, tipo, equipamentos) values
(1001, 'Polichinelo', 'cardio', 'forca', '{peso_corpo,casa}'),
(1002, 'Corrida estacionária (elevação de joelhos)', 'cardio', 'forca', '{peso_corpo,casa}'),
(1003, 'Burpee', 'cardio', 'forca', '{peso_corpo,casa}'),
(1004, 'Pular corda', 'cardio', 'forca', '{casa,academia}'),
(1005, 'Bicicleta ergométrica', 'cardio', 'forca', '{academia}'),
(1006, 'Esteira (caminhada/corrida)', 'cardio', 'forca', '{academia}'),
(1007, 'Remo ergômetro', 'cardio', 'forca', '{academia}')
on conflict (id) do nothing;

insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(1001, 7, 'cautela'),
(1002, 2, 'cautela'),
(1002, 7, 'cautela'),
(1003, 2, 'cautela'),
(1003, 3, 'cautela'),
(1004, 2, 'cautela'),
(1004, 7, 'cautela'),
(1006, 2, 'cautela'),
(1006, 7, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

notify pgrst, 'reload schema';
