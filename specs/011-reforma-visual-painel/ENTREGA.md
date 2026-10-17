# Entrega — Spec 011: Reforma visual do painel de gestão

| | |
|---|---|
| **Período** | 2026-10-17 → 2026-10-17 |
| **Branch** | `011-reforma-visual-painel` |
| **PRs** | [#139](https://github.com/pedroviana0/Adopt-Place/pull/139) mergeado em 2026-10-17 (merge `2f0b35a`), com os 5 checks da Vercel verdes |
| **Status** | ENTREGUE (2026-10-17), merge `2f0b35a`. Pendente fora do código: prints finais para a v21 e os slides |
| **Spec** | [`spec.md`](spec.md) |

Execução: Pedro, sozinho (D10), com a IA implementando tudo a pedido dele. Só frontend, sem migration
(D3): o merge é normal, sem virada especial.

## 1. O que a spec promete

| Onda | Conteúdo | Estado |
|---|---|---|
| 0 | Sabatina, `spec.md`, este `ENTREGA.md` e linha no índice | Concluída (`260f8ba`) |
| 1 | Spec-Kit (`plan.md`, `tasks.md`) | Concluída (`e4a43ed`, `ce23373`) |
| 2 | Testes vermelhos e tokens `-muted` novos | Concluída (`d6affc3`, `24aa1b5`) |
| 3 | Extração do `Dashboard` e redesenho por seção | Concluída (`24aa1b5`, `ed8c50a`) |
| 4 | Portão (SC-04) e homologação H1–H12 | Concluída; correção achada na H1 em `8f8d531` |
| 5 | PR, merge e prints para a v21 e os slides | PR #139 mergeado (`2f0b35a`); homologação dada como concluída pelo Pedro; prints finais com ele |

## 2. O que foi entregue

### Onda 0 — abertura (`260f8ba`)

- Sabatina das 13 questões abertas do [`GRILLING-BRIEF.md`](GRILLING-BRIEF.md), registradas como C1–C13.

### Onda 1 — Spec-Kit (`e4a43ed`, `ce23373`)

- `plan.md`, `research.md` (R1–R7), `data-model.md`, `contracts/ui-contracts.md`, `quickstart.md` e
  `tasks.md` (44 tarefas, seções do painel como US1–US6). Constitution Check sem violações.
- **C14:** `chart-2` dá 2,14:1 no tema claro; o 3:1 passou a valer para borda de "Requer ação" e foco,
  com barras e segmentos dispensados por terem equivalente em texto.

### Ondas 2 e 3 — implementação (`d6affc3`, `24aa1b5`, `ed8c50a`)

- **Linha de base:** `npm test` deu 324/327 com 14 arquivos quebrados (`SituacaoLT` `undefined`): o
  Prisma Client local não tinha sido regenerado depois do merge da 009. Depois de
  `npm run prisma:generate`: **450/450**.
- **Base (`d6affc3`):** 3 pares `-muted` em `styles.css`, `tone.ts`, tipos e `resolveHref` em
  `lib/dashboard-visual.ts`, `OperationalDashboard` extraído da rota sem mudança visual, fixtures e teste
  de não regressão (verde desde o início).
- **US1–US6 (`24aa1b5`):** testes escritos antes e vistos vermelhos (26 falhas); depois `PriorityList`,
  `IndicatorGroups`, `StatusBar`, `AdoptionFunnel`, `RecentActivity`, `DashboardSkeleton` e a rota com
  esqueleto e `Alert` + "Tentar de novo".
- **Funil (`ed8c50a`):** largura proporcional ao maior valor, mínimo de 4% para valor > 0, zero sem
  divisão por zero.

### Onda 4 — homologação (2026-10-17, branch Neon `dev`)

Ambiente: servidores locais contra o branch Neon **`dev`** (endpoint `ep-wandering-cake-ac7kk2mg`),
filho da produção e criado pelo Pedro para isso. Conferido no console do Neon: a produção usa outro
endpoint (`ep-lucky-mode-ac0aphq1`). Por ser cópia da produção, o `dev` tem dados reais: escritas de
teste foram mínimas e as temporárias foram apagadas (ver H5).

| H | Resultado | Evidência |
|---|---|---|
| H1 | ✅ após correção | `organizacao.teste`: 3 grupos, cores e ícones da C3; todos os `href` dos cards e da legenda iguais aos de antes e abrindo a lista certa. **A atividade recente apontava para `/dashboard/animais/<id>/saude`, rota que não existe ("Not Found").** O painel antigo não transformava a atividade em link e escondia isso. Corrigido em `8f8d531` (`resolveHref` leva ao detalhe, que tem a aba Saúde), com teste visto vermelho. |
| H2 | ✅ | `acolhedor.teste`: 2 grupos, nenhum texto de LT, sem buraco; pendências e funil vazios com os textos da spec. |
| H3 | ✅ | ONG nova criada pela interface no local (`ong.vazia.011@example.com`, branch `dev`): todos os estados vazios, sem "Requer ação" e sem a seção de atividade. |
| H4 | ✅ | "Requer ação" em "Cuidados atrasados" com 1 (e 5); ausente nos cards com 0. |
| H5 | ✅ | 4 cuidados atrasados temporários criados por script no `dev` (marcados `[H5-011] temporario`): 5 itens visíveis + "Mostrar todas (6)"; Enter expande para 6 e o botão vira "Mostrar menos" com `aria-expanded="true"`. Os 4 foram apagados em seguida. |
| H6 | ✅ | Os 4 itens da legenda levam a `/dashboard/animais?status=…`; "Adotado" abre a lista filtrada. |
| H7 | ✅ | Falha simulada só em `/api/dashboard/operacional` (backend no ar): depois das novas tentativas aparece o `Alert` com "Tentar de novo"; o clique recupera o painel. O esqueleto foi coberto pelo render test (2 grupos, `aria-busy`). |
| H8 | ✅ | Claro e escuro sem regressão (capturas em `prints/`). |
| H9 | ✅ | 375×812, 640×400 (zoom 200%), 768×1024 e 1280×900: `scrollWidth` ≤ largura, sem rolagem horizontal. No celular os cards ficam horizontais. |
| H10 | ✅ | Tab percorre cards, legenda e atividade em ordem; anel de foco teal com contorno, `:focus-visible` ativo; "Mostrar todas" operável por Enter. |
| H11 | ✅ | Medido na página real, depois das animações: **0 de 110 textos abaixo de 4,5:1** nos dois temas (pior 7,12:1). Borda de "Requer ação": 5,87:1 (claro) e 3,4:1 (escuro). Anel de foco: 7,42:1 e 10,62:1. A troca prevista da borda escura não foi necessária. |
| H12 | ⚠️ parcial | Prints de **referência** em `prints/` (claro e escuro). O painel do navegador da IA tem 709 px de largura, menor que o desktop. Os prints finais para a v21 e os slides ficam com o Pedro, na tela dele. |

**Portão final (2026-10-17, depois de `8f8d531`):** `npm test` **485/485**; `tsc` da raiz e do frontend
OK; build do frontend OK; `routeTree.gen.ts` inalterado; `git diff main...HEAD` vazio em `app/`, `lib/`,
`prisma/`, `package*.json` e `vitest.config.ts`.

**Observações que não contam como falha:**
- Com o backend **inteiro** parado, a tela fica em "Carregando…" antes do painel: a sessão não carrega.
  É o defeito F3 da ROUTES-01, anterior à 011 e fora de escopo.
- A mensagem do erro de rede é a do navegador ("Failed to fetch", em inglês): é a mesma mensagem que o
  painel antigo mostrava (C8 manteve a mensagem). Traduzir fica como melhoria futura.
- Os títulos das pendências e das atividades seguem sem acento ("Concluir adocao de Brad"): vêm do
  backend, fora de escopo (Fora de escopo, item 3).

## 3. Decisões que não se reabrem

- As da `spec.md` (D1–D10, C1–C14). Em especial: mesmas informações (D2), só frontend (D3), cor do grupo
  × cor do estado (C3) e os 3 pares `-muted` novos em `styles.css`.
- **Divergência do plano, decidida pelo Pedro:** o `tsconfig.json` da raiz ganhou
  `__tests__/frontend/*-render.test.ts` no `exclude`. O tsc da raiz segue os imports até os componentes e
  resolve o `@/` pela raiz. Recusados: fallback no `paths` (import quebrado do backend resolveria em
  silêncio para o frontend) e abandonar o render test.
- O render test importa `react` e `react-dom/server` de `frontend/node_modules`, em vez de
  `resolve.dedupe` no `vitest.config.ts`, que ficou intocado.
- **`resolveHref` passou a corrigir dois caminhos do backend** (agenda e saúde do animal). Os dois são
  defeitos de contrato do backend contornados no frontend, como já era o da agenda. Quando o backend for
  corrigido, a função pode encolher.
- A atividade recente virou link (RF-ATV-01). Antes era só texto.

## 4. O que a spec previa e não foi entregue

- **Prints finais (H12):** ficam com o Pedro, na resolução da tela dele.
- No código, nada. O PR #139 entrou na `main` em 2026-10-17 (`2f0b35a`) e o deploy automático pôs a 011 no ar.

## 5. Armadilhas descobertas

- **Prisma Client desatualizado parece regressão.** Depois de um merge com mudança de enum, 14 arquivos
  de teste quebram com `SituacaoLT` `undefined`. Rode `npm run prisma:generate` antes de julgar a linha
  de base.
- **O Vitest e o `tsc` resolvem o `@/` de jeitos diferentes.** O Vitest usa o `tsconfig` de quem importa;
  o `tsc --noEmit` da raiz usa só o `paths` da raiz. A research R1 mediu só o Vitest. Teste em
  `__tests__/frontend/` que importa componente com `@/` precisa ficar fora do tsc da raiz.
- **Dois Reacts no teste de renderização.** `react-dom/server` da raiz com um componente que usa
  `useState` do frontend dá `Cannot read properties of null (reading 'useState')`. Os testes antigos
  passavam porque nenhum componente testado tinha hook.
- **`Skeleton` do shadcn usa `bg-primary/10`**, que não emite alpha aqui (§8 do `CLAUDE.md`) e sairia teal
  sólido. O esqueleto do painel sobrescreve com `bg-muted`.
- **`Alert` força `[&>svg]:text-foreground`**, com especificidade maior que uma classe solta: a cor do
  ícone precisa vir também por `[&>svg]:…`.
- **Transformar texto em link revela `href` quebrado.** O backend já mandava `href` nas atividades, e
  ninguém sabia que um deles não existia. Ao virar link, clique em todos.
- **Detectar byte nulo:** no bash, `$'\x00'` vira padrão vazio e casa com toda linha. Conte bytes com
  Python. E ao gerar texto com Python, escreva a sequência como `"\\\\x00"`: com `"\\x00"` o próprio
  Python grava um nulo de verdade (aconteceu neste arquivo).
- **React Query v5 escuta `visibilitychange` na `window`**, não no `document`: para forçar nova busca em
  teste manual, dispare o evento na `window`.
- **Navegar para a mesma URL não recarrega** no navegador embutido; use `location.reload()`.
- **Texto vermelho direto (`text-destructive`) falha no escuro (3,08:1).** No painel, erro e "Atrasado"
  usam o par `destructive-muted`.

## 6. Onde o código vive

- `frontend/src/lib/dashboard-visual.ts`: view-model puro (grupos, "Requer ação", corte das pendências,
  fatias de status, largura do funil, tons por tipo, `resolveHref`).
- `frontend/src/components/app/dashboard/`: `OperationalDashboard`, `PriorityList`, `IndicatorGroups`,
  `StatusBar`, `AdoptionFunnel`, `RecentActivity`, `DashboardSkeleton` e `tone.ts`.
- `frontend/src/routes/_authenticated.dashboard.index.tsx`: sessão, ADMIN, query, esqueleto e erro.
- `frontend/src/styles.css`: `--primary-muted`, `--destructive-muted`, `--brand-muted` e os `-foreground`.
- `__tests__/frontend/dashboard-visual.test.ts`, `dashboard-render.test.ts` e `dashboard-fixtures.ts`.
- `tsconfig.json` (raiz): `exclude` do render test.

## 7. Para quem vier depois

- Para estender o visual a outras telas da gestão (fora de escopo aqui), reaproveite `tone.ts` e os pares
  `-muted`. Não monte classe de cor por template string.
- O `ep-wandering-cake` (`dev`) é cópia da produção: dado real. Não use para seed nem reset.
- A conta `ong.vazia.011@example.com` ficou no branch `dev` para repetir a H3.
