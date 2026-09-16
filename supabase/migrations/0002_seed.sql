-- ============================================================
-- Treina+ · Seed — restrições, catálogo de exercícios e
-- mapa de contraindicações (evitar / cautela)
-- ============================================================

-- ------------------------------------------------------------------
-- RESTRIÇÕES
-- ------------------------------------------------------------------
insert into public.restricao (id, nome) values
  (1, 'ombro'),
  (2, 'joelho'),
  (3, 'lombar'),
  (4, 'punho'),
  (5, 'cotovelo'),
  (6, 'pescoço'),
  (7, 'tornozelo')
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- EXERCÍCIOS DE FORÇA
-- ------------------------------------------------------------------
insert into public.exercicio (id, nome, grupo_muscular, tipo, equipamentos) values
-- PEITO (101–112)
(101, 'Supino reto com barra', 'peito', 'forca', '{academia}'),
(102, 'Supino inclinado com barra', 'peito', 'forca', '{academia}'),
(103, 'Supino reto com halteres', 'peito', 'forca', '{academia,halteres}'),
(104, 'Supino inclinado com halteres', 'peito', 'forca', '{academia,halteres}'),
(105, 'Crucifixo com halteres', 'peito', 'forca', '{academia,halteres}'),
(106, 'Crucifixo na polia (fly)', 'peito', 'forca', '{academia}'),
(107, 'Supino na máquina (peck deck)', 'peito', 'forca', '{academia}'),
(108, 'Flexão de braços', 'peito', 'forca', '{peso_corpo,casa}'),
(109, 'Flexão com pés elevados', 'peito', 'forca', '{peso_corpo,casa}'),
(110, 'Mergulho nas paralelas', 'peito', 'forca', '{academia}'),
(111, 'Crossover na polia alta', 'peito', 'forca', '{academia}'),
(112, 'Supino na máquina articulada', 'peito', 'forca', '{academia}'),
-- COSTAS (201–212)
(201, 'Barra fixa (puxada)', 'costas', 'forca', '{academia}'),
(202, 'Puxada frontal na polia', 'costas', 'forca', '{academia}'),
(203, 'Puxada aberta (atrás)', 'costas', 'forca', '{academia}'),
(204, 'Remada curvada com barra', 'costas', 'forca', '{academia}'),
(205, 'Remada com halteres (um braço)', 'costas', 'forca', '{academia,halteres}'),
(206, 'Remada na polia baixa', 'costas', 'forca', '{academia}'),
(207, 'Remada na máquina', 'costas', 'forca', '{academia}'),
(208, 'Face pull na polia', 'costas', 'forca', '{academia}'),
(209, 'Levantamento terra', 'costas', 'forca', '{academia}'),
(210, 'Terra romeno (stiff)', 'costas', 'forca', '{academia,halteres}'),
(211, 'Barra fixa supinada (chin-up)', 'costas', 'forca', '{academia}'),
(212, 'Remada baixa com triângulo', 'costas', 'forca', '{academia}'),
-- QUADRÍCEPS (301–311)
(301, 'Agachamento livre', 'quadriceps', 'forca', '{academia}'),
(302, 'Agachamento frontal', 'quadriceps', 'forca', '{academia}'),
(303, 'Leg press 45º', 'quadriceps', 'forca', '{academia}'),
(304, 'Extensão de joelhos (cadeira extensora)', 'quadriceps', 'forca', '{academia}'),
(305, 'Agachamento goblet com halteres', 'quadriceps', 'forca', '{academia,halteres}'),
(306, 'Agachamento búlgaro', 'quadriceps', 'forca', '{halteres,peso_corpo,casa}'),
(307, 'Avanço (afundo)', 'quadriceps', 'forca', '{halteres,peso_corpo,casa}'),
(308, 'Agachamento com peso corporal', 'quadriceps', 'forca', '{peso_corpo,casa}'),
(309, 'Hack squat', 'quadriceps', 'forca', '{academia}'),
(310, 'Step-up no caixote', 'quadriceps', 'forca', '{academia,casa}'),
(311, 'Agachamento isométrico na parede', 'quadriceps', 'forca', '{peso_corpo,casa}'),
-- POSTERIOR (312–317)
(312, 'Cadeira flexora (mesa flexora)', 'posterior', 'forca', '{academia}'),
(313, 'Flexão de joelhos nórdica', 'posterior', 'forca', '{peso_corpo,casa}'),
(314, 'Good morning com barra', 'posterior', 'forca', '{academia}'),
(315, 'Terra romeno unilateral com halteres', 'posterior', 'forca', '{halteres}'),
(316, 'Cadeira flexora unilateral', 'posterior', 'forca', '{academia}'),
-- GLÚTEOS (317–323)
(317, 'Elevação pélvica (hip thrust)', 'gluteos', 'forca', '{academia,halteres}'),
(318, 'Ponte de glúteos', 'gluteos', 'forca', '{peso_corpo,casa}'),
(319, 'Coice na polia (kickback)', 'gluteos', 'forca', '{academia}'),
(320, 'Abdução de quadril na máquina', 'gluteos', 'forca', '{academia}'),
(321, 'Abdução em pé na polia', 'gluteos', 'forca', '{academia}'),
(322, 'Ponte de glúteos unilateral', 'gluteos', 'forca', '{peso_corpo,casa}'),
-- PANTURRILHA (323–326)
(323, 'Panturrilha em pé na máquina', 'panturrilha', 'forca', '{academia}'),
(324, 'Panturrilha sentado', 'panturrilha', 'forca', '{academia}'),
(325, 'Panturrilha no degrau com halteres', 'panturrilha', 'forca', '{halteres,academia}'),
(326, 'Panturrilha unilateral no degrau', 'panturrilha', 'forca', '{peso_corpo,casa}'),
-- OMBROS (401–410)
(401, 'Desenvolvimento com barra (militar)', 'ombros', 'forca', '{academia}'),
(402, 'Desenvolvimento com halteres sentado', 'ombros', 'forca', '{academia,halteres}'),
(403, 'Elevação lateral com halteres', 'ombros', 'forca', '{academia,halteres}'),
(404, 'Elevação frontal com halteres', 'ombros', 'forca', '{academia,halteres}'),
(405, 'Remada alta (para o queixo)', 'ombros', 'forca', '{academia,halteres}'),
(406, 'Desenvolvimento na máquina (shoulder press)', 'ombros', 'forca', '{academia}'),
(407, 'Encolhimento de ombros (shrugs)', 'ombros', 'forca', '{academia,halteres}'),
(408, 'Crucifixo invertido (reverse fly)', 'ombros', 'forca', '{academia,halteres}'),
(409, 'Arnold press com halteres', 'ombros', 'forca', '{academia,halteres}'),
(410, 'Elevação lateral na polia', 'ombros', 'forca', '{academia}'),
-- BÍCEPS (501–508)
(501, 'Rosca direta com barra', 'biceps', 'forca', '{academia}'),
(502, 'Rosca alternada com halteres', 'biceps', 'forca', '{academia,halteres}'),
(503, 'Rosca martelo', 'biceps', 'forca', '{academia,halteres}'),
(504, 'Rosca na polia com corda', 'biceps', 'forca', '{academia}'),
(505, 'Rosca concentrada', 'biceps', 'forca', '{halteres,casa}'),
(506, 'Rosca scott', 'biceps', 'forca', '{academia}'),
(507, 'Rosca inclinada com halteres', 'biceps', 'forca', '{academia,halteres}'),
(508, 'Rosca inversa', 'biceps', 'forca', '{academia,halteres}'),
-- TRÍCEPS (601–607)
(601, 'Tríceps na polia com corda', 'triceps', 'forca', '{academia}'),
(602, 'Tríceps testa deitado (barra)', 'triceps', 'forca', '{academia}'),
(603, 'Tríceps francês com halteres', 'triceps', 'forca', '{academia,halteres}'),
(604, 'Supino fechado', 'triceps', 'forca', '{academia}'),
(605, 'Tríceps no banco (mergulho invertido)', 'triceps', 'forca', '{academia,casa}'),
(606, 'Tríceps coice com halteres', 'triceps', 'forca', '{academia,halteres}'),
(607, 'Extensão de tríceps na polia baixa', 'triceps', 'forca', '{academia}'),
-- CORE (701–712)
(701, 'Prancha isométrica', 'core', 'estabilidade', '{peso_corpo,casa}'),
(702, 'Prancha lateral', 'core', 'estabilidade', '{peso_corpo,casa}'),
(703, 'Dead bug', 'core', 'estabilidade', '{peso_corpo,casa}'),
(704, 'Bird-dog', 'core', 'estabilidade', '{peso_corpo,casa}'),
(705, 'Abdominal crunch', 'core', 'forca', '{peso_corpo,casa}'),
(706, 'Abdominal na polia (cable crunch)', 'core', 'forca', '{academia}'),
(707, 'Elevação de pernas suspenso', 'core', 'forca', '{academia}'),
(708, 'Russian twist', 'core', 'forca', '{peso_corpo,casa}'),
(709, 'Pallof press', 'core', 'estabilidade', '{academia,halteres}'),
(710, 'Máquina abdominal (remador)', 'core', 'forca', '{academia}'),
(711, 'Prancha com toque de ombro', 'core', 'estabilidade', '{peso_corpo,casa}'),
(712, 'Mountain climber', 'core', 'forca', '{peso_corpo,casa}'),
-- ANTEBRAÇO (801–803)
(801, 'Rosca de punho', 'antebraco', 'forca', '{academia,halteres}'),
(802, 'Rosca de punho inversa', 'antebraco', 'forca', '{academia,halteres}'),
(803, 'Farmer carry (caminhada com carga)', 'antebraco', 'forca', '{academia,halteres}')
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- VARIAÇÕES PARA CASA / PESO CORPORAL
-- ------------------------------------------------------------------
insert into public.exercicio (id, nome, grupo_muscular, tipo, equipamentos) values
(213, 'Remada invertida (mesa/anel)', 'costas', 'forca', '{peso_corpo,casa}'),
(214, 'Superman (extensão de tronco)', 'costas', 'forca', '{peso_corpo,casa}'),
(411, 'Flexão pike', 'ombros', 'forca', '{peso_corpo,casa}'),
(412, 'Elevação frontal com toalha (isometria)', 'ombros', 'forca', '{peso_corpo,casa}'),
(509, 'Rosca isométrica com toalha', 'biceps', 'forca', '{peso_corpo,casa}'),
(608, 'Tríceps francês com toalha', 'triceps', 'forca', '{peso_corpo,casa}'),
(609, 'Mergulho entre cadeiras', 'triceps', 'forca', '{peso_corpo,casa}'),
(327, 'Panturrilha em pé com peso corporal', 'panturrilha', 'forca', '{peso_corpo,casa}'),
(804, 'Dead hang (pendura na barra)', 'antebraco', 'forca', '{peso_corpo}')
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- MOBILIDADE (901–909)
-- ------------------------------------------------------------------
insert into public.exercicio (id, nome, grupo_muscular, tipo, equipamentos) values
(901, 'Gato-camelo', 'mobilidade', 'mobilidade', '{peso_corpo}'),
(902, 'Rotações de quadril em pé', 'mobilidade', 'mobilidade', '{peso_corpo}'),
(903, 'Agachamento profundo com elevação de braços', 'mobilidade', 'mobilidade', '{peso_corpo}'),
(904, 'Mobilidade de tornozelo (pé na parede)', 'mobilidade', 'mobilidade', '{peso_corpo}'),
(905, 'Passagem de agulha (thread the needle)', 'mobilidade', 'mobilidade', '{peso_corpo}'),
(906, 'Rotações de ombro (círculos)', 'mobilidade', 'mobilidade', '{peso_corpo}'),
(907, 'Círculos de braços', 'mobilidade', 'mobilidade', '{peso_corpo}'),
(908, 'Rotação torácica deitado', 'mobilidade', 'mobilidade', '{peso_corpo}'),
(909, 'Alongamento de peito na porta', 'mobilidade', 'mobilidade', '{peso_corpo,casa}')
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- AQUECIMENTO / ATIVAÇÃO ESPECÍFICA (1101–1108)
-- ------------------------------------------------------------------
insert into public.exercicio (id, nome, grupo_muscular, tipo, equipamentos) values
(1101, 'Flexão de joelhos (ativação peito)', 'peito', 'aquecimento', '{peso_corpo,casa}'),
(1102, 'Remada escapular (ativação costas)', 'costas', 'aquecimento', '{peso_corpo,casa}'),
(1103, 'Y-T-W deitado (ativação ombros)', 'ombros', 'aquecimento', '{peso_corpo}'),
(1104, 'Agachamento corporal leve (ativação pernas)', 'quadriceps', 'aquecimento', '{peso_corpo}'),
(1105, 'Ponte de glúteos (ativação glúteos)', 'gluteos', 'aquecimento', '{peso_corpo}'),
(1106, 'Isometria de bíceps com toalha (ativação)', 'biceps', 'aquecimento', '{peso_corpo,casa}'),
(1107, 'Extensão de cotovelo com toalha (ativação tríceps)', 'triceps', 'aquecimento', '{peso_corpo,casa}'),
(1108, 'Crunch leve (ativação core)', 'core', 'aquecimento', '{peso_corpo}')
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- MAPA DE CONTRAINDICAÇÕES (exercicio_restricao)
-- ------------------------------------------------------------------
-- OMBRO (1) CATELA/EVITAR
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(101, 1, 'cautela'), (102, 1, 'cautela'), (103, 1, 'cautela'), (104, 1, 'cautela'),
(105, 1, 'evitar'), (106, 1, 'evitar'), (107, 1, 'cautela'), (108, 1, 'cautela'),
(109, 1, 'cautela'), (110, 1, 'evitar'), (111, 1, 'evitar'), (112, 1, 'cautela'),
(201, 1, 'cautela'), (202, 1, 'cautela'), (203, 1, 'evitar'), (208, 1, 'cautela'),
(211, 1, 'cautela'), (401, 1, 'evitar'), (402, 1, 'cautela'), (403, 1, 'evitar'),
(404, 1, 'cautela'), (405, 1, 'evitar'), (406, 1, 'cautela'), (407, 1, 'cautela'),
(408, 1, 'cautela'), (409, 1, 'evitar'), (410, 1, 'evitar'), (507, 1, 'cautela'),
(602, 1, 'cautela'), (605, 1, 'evitar')
on conflict (exercicio_id, restricao_id) do nothing;

-- JOELHO (2)
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(301, 2, 'cautela'), (302, 2, 'cautela'), (303, 2, 'cautela'), (304, 2, 'cautela'),
(305, 2, 'cautela'), (306, 2, 'cautela'), (307, 2, 'cautela'), (308, 2, 'cautela'),
(309, 2, 'cautela'), (310, 2, 'cautela'), (311, 2, 'cautela'), (312, 2, 'cautela'),
(313, 2, 'cautela'), (316, 2, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

-- LOMBAR (3)
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(204, 3, 'cautela'), (205, 3, 'cautela'), (206, 3, 'cautela'), (209, 3, 'evitar'),
(210, 3, 'cautela'), (212, 3, 'cautela'), (301, 3, 'cautela'), (302, 3, 'cautela'),
(303, 3, 'cautela'), (309, 3, 'cautela'), (314, 3, 'evitar'), (315, 3, 'cautela'),
(401, 3, 'cautela'), (701, 3, 'cautela'), (702, 3, 'cautela'), (703, 3, 'cautela'),
(704, 3, 'cautela'), (705, 3, 'cautela'), (706, 3, 'cautela'), (707, 3, 'cautela'),
(708, 3, 'cautela'), (709, 3, 'cautela'), (710, 3, 'cautela'), (711, 3, 'cautela'),
(712, 3, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

-- PUNHO (4)
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(101, 4, 'cautela'), (103, 4, 'cautela'), (108, 4, 'cautela'), (109, 4, 'cautela'),
(110, 4, 'cautela'), (204, 4, 'cautela'), (302, 4, 'cautela'), (501, 4, 'cautela'),
(503, 4, 'cautela'), (508, 4, 'cautela'), (604, 4, 'cautela'), (605, 4, 'cautela'),
(701, 4, 'cautela'), (711, 4, 'cautela'), (712, 4, 'cautela'), (801, 4, 'cautela'),
(802, 4, 'cautela'), (803, 4, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

-- COTOVELO (5)
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(110, 5, 'cautela'), (201, 5, 'cautela'), (211, 5, 'cautela'), (501, 5, 'cautela'),
(502, 5, 'cautela'), (503, 5, 'cautela'), (505, 5, 'cautela'), (506, 5, 'evitar'),
(507, 5, 'cautela'), (601, 5, 'cautela'), (602, 5, 'cautela'), (603, 5, 'cautela'),
(604, 5, 'cautela'), (605, 5, 'cautela'), (606, 5, 'cautela'), (607, 5, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

-- PESCOÇO (6)
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(203, 6, 'evitar'), (208, 6, 'cautela'), (209, 6, 'cautela'), (401, 6, 'cautela'),
(405, 6, 'cautela'), (407, 6, 'cautela'), (705, 6, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

-- TORNOZELO (7)
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(301, 7, 'cautela'), (302, 7, 'cautela'), (305, 7, 'cautela'), (306, 7, 'cautela'),
(307, 7, 'cautela'), (310, 7, 'cautela'), (323, 7, 'cautela'), (324, 7, 'cautela'),
(325, 7, 'cautela'), (326, 7, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

-- Variações peso corporal
insert into public.exercicio_restricao (exercicio_id, restricao_id, nivel) values
(213, 3, 'cautela'), (214, 3, 'cautela'), (411, 1, 'evitar'), (411, 3, 'cautela'),
(412, 1, 'cautela'), (608, 5, 'cautela'), (609, 1, 'cautela'), (609, 5, 'cautela'),
(804, 1, 'cautela'), (804, 4, 'cautela'), (327, 7, 'cautela')
on conflict (exercicio_id, restricao_id) do nothing;

-- Cautela: ombro -> flexão e agachamentos já cobertos acima.
-- ------------------------------------------------------------------
-- FIM DO SEED
-- ------------------------------------------------------------------