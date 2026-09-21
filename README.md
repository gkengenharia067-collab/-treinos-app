# Treina+ · App de treinos personalizados

Dashboard web de treinos personalizados com backend Supabase (Postgres + Auth + Storage + Row Level Security). Multi-tenant desde o dia 1: cada usuário só acessa os próprios dados via policies `auth.uid() = usuario_id`.

## Stack

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4 + componentes no estilo shadcn/ui + Recharts
- **Backend:** Supabase (Postgres, Auth, Storage, RLS)
- **Deploy:** Vercel

## Estrutura

```
supabase/migrations/
  0001_schema.sql        # tabelas, índices, RLS, storage e trigger de novo usuário
  0002_seed.sql          # restrições, catálogo de exercícios e contraindicações
  0003_gerar_treino.sql  # função atômica de geração/regeneração de treino
src/
  lib/         # supabase client, tipos, cálculos corporais, gerador, progressão
  context/     # autenticação
  components/  # UI (shadcn) e layout
  pages/       # telas
```

## Setup do Supabase

1. Crie um projeto em <https://supabase.com>.
2. Em **SQL Editor**, execute na ordem o conteúdo de:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_seed.sql`
   - `supabase/migrations/0003_gerar_treino.sql`
   - `supabase/migrations/0004_permissoes_storage.sql` (idempotente)
   - `supabase/migrations/0005_divisao_por_dias_e_cardio.sql` (idempotente)
   - `supabase/migrations/0006_fix_validacao_divisao.sql` (idempotente)
   - `supabase/migrations/0007_sessao_exercicio_ativo.sql` (idempotente)

   (ou use o CLI: `supabase db push` com os arquivos em `supabase/migrations`)

   > **Importante:** o Supabase não concede mais privilégios automaticamente a
   > `anon`/`authenticated` para objetos criados via SQL. Sem os `GRANT` do
   > `0004`, o PostgREST responde `permission denied for table ...`. O `0004`
   > pode ser reexecutado sem efeitos colaterais.
   >
   > Se a criação do bucket `avatares` via SQL falhar (linha de aviso no SQL
   > Editor), crie-o manualmente em **Storage → New bucket**: nome `avatares`,
   > **Public bucket = ON**.
3. Em **Authentication → Providers → Email**, defina o que preferir. Com confirmação de e-mail ligada, o usuário confirma o link e depois faz login para concluir o wizard (os dados ficam salvos no navegador).
4. Copie a URL do projeto e a `anon key` (Project Settings → API) para o `.env`:

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
VITE_APP_ACCESS_PASSWORD=SUA_SENHA_DE_ACESSO
```

> O bucket `avatares` e suas policies são criados na migration `0001`.
>
> `VITE_APP_ACCESS_PASSWORD` habilita o portão de acesso inicial (tela de senha).
> Se ficar em branco, o portão é desativado. É apenas uma barreira de entrada —
> a proteção real dos dados continua sendo o Supabase Auth + RLS.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com suas credenciais
npm run dev
```

Build de produção: `npm run build` · Lint: `npm run lint`.

## Deploy na Vercel

1. Importe o repositório na Vercel (framework **Vite**).
2. Defina as variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_APP_ACCESS_PASSWORD` em **Settings → Environment Variables**.
3. Build command `npm run build`, output `dist`.

## Regras implementadas (Fase 1 / MVP)

- **Cadastro wizard multi-step:** dados pessoais → medidas → objetivo → dias → nível → equipamentos → restrições.
- **Divisão automática por dias** (tabela `SPLIT_POR_DIAS` em `constants.ts`): 1=Full Body · 2=Superiores/Inferiores · 3=ABC · 4=ABCD · 5=ABCDE (costas+bíceps / posterior / peito+tríceps / quadríceps / braços+ombro) · 6=ABCDEF (+ abdômen+cardio) · 7=ABCDEFG (+ recuperação ativa, só mobilidade/cardio leve). `treino.divisao` guarda o resultado calculado.
- **Parâmetros por objetivo:** séries, reps e descanso conforme a tabela de hipertrofia/definição/força/resistência.
- **Aquecimento fixo (5–8 min):** mobilidade + estabilidade + ativação específica do grupo do dia (sem imagens de terceiros).
- **Filtro de contraindicação:** exercícios marcados como `evitar` são excluídos; `cautela` entram com aviso.
- **Métodos de progressão:** linear (iniciante), double progression (intermediário) e RPE/autorregulação (avançado), com sugestão de próxima carga na tela de execução.
- **Cálculos:** IMC, %G por US Navy, %G por Pollock 3 dobras (Jackson & Pollock + Siri), massa gorda/magra, RCQ e CMB.
- **Execução ao vivo:** séries, reps, carga, RPE, observações e histórico por exercício.
- **Evolução:** cards de métricas, gráfico de linha, radar de perímetros, tabela de progressão de carga e badges.
- **Troca de exercício:** durante a sessão, o usuário pode substituir um exercício por outra alternativa do mesmo grupo muscular, compatível com seus equipamentos e restrições. A linha antiga é desativada (`sessao_exercicio.ativo = false`), preservando o histórico de execução.
- **Portão de acesso:** tela de senha (`VITE_APP_ACCESS_PASSWORD`) antes do app; liberação por sessão do navegador.

## Sobre o campo `plano`

O campo `usuario.plano` existe desde já (`'pago'` por enquanto, com valores futuros `'basico' | 'premium'`), mas **nenhuma tela ou regra bloqueia acesso com base nele**. A segmentação de recursos por nível de assinatura fica para uma fase futura, decidida depois de observar o uso real dos primeiros usuários.
