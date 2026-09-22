-- ============================================================
-- 0008 · Mais exercícios (variações casa/peso corporal)
--
-- A troca de exercício precisa de muitas opções por grupo
-- muscular. Grupos como quadríceps tinham pouquíssimas variações
-- compatíveis com treino em casa (o usuário via ~5 opções).
-- Esta migration adiciona 37 exercícios 100% casa/peso corporal
-- (ids 1201–1237) + mapa de contraindicações.
-- Idempotente.
-- ============================================================

insert into public.exercicio (id, nome, grupo_muscular, tipo, equipamentos) values
-- QUADRÍCEPS (1201–1212)
(1201, 'Agachamento com cadeira (sentar e levantar)', 'quadriceps', 'forca', '{peso_corpo,casa}'),
(1202, 'Agachamento com pausa (3s no fundo)', 'quadriceps', 'forca', '{peso_corpo,casa}'),
(1203, 'Avanço reverso (afundo reverso)', 'quadriceps', 'forca', '{peso_corpo,casa}'),
(1204, 'Avanço cruzado (curtsy lunge)', 'quadriceps', 'forca', '{peso_corpo,casa}'),
(1205, 'Agachamento com salto (squat jump)', 'quadriceps', 'forca', '{peso_corpo,casa}'),
(1206, 'Agachamento unipodal assistido (pistol)', 'quadriceps', 'forca', '{peso_corpo,casa}'),
(1207, 'Subida na cadeira (step-up)', 'quadriceps', 'forca', '{peso_corpo,casa}'),
(1208, 'Agachamento com mochila carregada', 'quadriceps', 'forca', '{casa}'),
(1209, 'Agachamento goblet com halteres', 'quadriceps', 'forca', '{halteres,casa}'),
(1210, 'Agachamento sumô', 'quadriceps', 'forca', '{peso_corpo,casa}'),
(1211, 'Agachamento com calcanhar elevado', 'quadriceps', 'forca', '{peso_corpo,casa}'),
(1212, 'Avanço caminhando (walking lunge)', 'quadriceps', 'forca', '{peso_corpo,casa}'),
-- GLÚTEOS (1213–1216)
(1213, 'Abdução deitada (clamshell)', 'gluteos', 'forca', '{peso_corpo,casa}'),
(1214, 'Fire hydrant (abdução de quadril)', 'gluteos', 'forca', '{peso_corpo,casa}'),
(1215, 'Ponte de glúteos com marcha', 'gluteos', 'forca', '{peso_corpo,casa}'),
(1216, 'Elevação pélvica com mochila (hip thrust em casa)', 'gluteos', 'forca', '{casa}'),
-- POSTERIOR (1217–1219)
(1217, 'Bom dia sem peso (good morning corporal)', 'posterior', 'forca', '{peso_corpo,casa}'),
(1218, 'Bom dia com mochila/halteres', 'posterior', 'forca', '{halteres,casa}'),
(1219, 'Stiff unilateral com garrafa/mochila', 'posterior', 'forca', '{casa}'),
-- PANTURRILHA (1220–1221)
(1220, 'Panturrilha unilateral no degrau/escada', 'panturrilha', 'forca', '{peso_corpo,casa}'),
(1221, 'Panturrilha com halteres em casa', 'panturrilha', 'forca', '{halteres,casa}'),
-- PEITO (1222–1224)
(1222, 'Flexão afastada (flexão larga)', 'peito', 'forca', '{peso_corpo,casa}'),
(1223, 'Flexão diamante', 'peito', 'forca', '{peso_corpo,casa}'),
(1224, 'Flexão hindu (dive bomber)', 'peito', 'forca', '{peso_corpo,casa}'),
-- COSTAS (1225–1227)
(1225, 'Remada na porta com toalha (isometria)', 'costas', 'forca', '{peso_corpo,casa}'),
(1226, 'Remada invertida supinada na mesa', 'costas', 'forca', '{peso_corpo,casa}'),
(1227, 'Superman com rotação', 'costas', 'forca', '{peso_corpo,casa}'),
-- OMBROS (1228–1230)
(1228, 'Elevação lateral com garrafas de água', 'ombros', 'forca', '{peso_corpo,casa}'),
(1229, 'Desenvolvimento com mochila sentado', 'ombros', 'forca', '{casa}'),
(1230, 'Crucifixo invertido com garrafas (reverse fly)', 'ombros', 'forca', '{peso_corpo,casa}'),
-- BÍCEPS (1231–1232)
(1231, 'Rosca com mochila/garrafas', 'biceps', 'forca', '{casa}'),
(1232, 'Chin-up na mesa (remada invertida supinada)', 'biceps', 'forca', '{peso_corpo,casa}'),
-- TRÍCEPS (1233–1234)
(1233, 'Mergulho no sofá/cadeira (tríceps)', 'triceps', 'forca', '{peso_corpo,casa}'),
(1234, 'Extensão de tríceps com garrafa/mochila', 'triceps', 'forca', '{casa}'),
-- CORE (1235–1237)
(1235, 'Abdominal bicicleta', 'core', 'forca', '{peso_corpo,casa}'),
(1236, 'Elevação de pernas deitado', 'core', 'forca', '{peso_corpo,casa}'),
(1237, 'Crunch reverso', 'core', 'forca', '{peso_corpo,casa}')
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- MAPA DE CONTRAINDICAÇÕES (apenas cautela — nada é evitado aqui)
-- ------------------------------------------------------------------
-- JOELHO (2)
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(1201, 2, 'cautela'), (1202, 2, 'cautela'), (1203, 2, 'cautela'), (1204, 2, 'cautela'),
(1205, 2, 'cautela'), (1206, 2, 'cautela'), (1207, 2, 'cautela'), (1208, 2, 'cautela'),
(1209, 2, 'cautela'), (1210, 2, 'cautela'), (1211, 2, 'cautela'), (1212, 2, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

-- TORNOZELO (7)
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(1203, 7, 'cautela'), (1204, 7, 'cautela'), (1205, 7, 'cautela'), (1206, 7, 'cautela'),
(1212, 7, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

-- LOMBAR (3)
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(1217, 3, 'cautela'), (1218, 3, 'cautela'), (1219, 3, 'cautela'), (1225, 3, 'cautela'),
(1227, 3, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

-- PUNHO (4)
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(1222, 4, 'cautela'), (1223, 4, 'cautela'), (1224, 4, 'cautela'), (1226, 4, 'cautela'),
(1232, 4, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

-- COTOVELO (5)
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(1222, 5, 'cautela'), (1223, 5, 'cautela'), (1224, 5, 'cautela'), (1231, 5, 'cautela'),
(1232, 5, 'cautela'), (1233, 5, 'cautela'), (1234, 5, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

-- OMBRO (1)
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(1224, 1, 'cautela'), (1228, 1, 'cautela'), (1230, 1, 'cautela'), (1233, 1, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

notify pgrst, 'reload schema';