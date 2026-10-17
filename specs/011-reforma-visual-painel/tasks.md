---

description: "Tarefas da spec 011 — reforma visual do painel de gestão"
---

# Tasks: Reforma visual do painel de gestão

**Input**: `specs/011-reforma-visual-painel/` — `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/ui-contracts.md`, `quickstart.md`

**Tests**: pedidos pela spec (C11). Cada história escreve o teste **antes** e o vê **vermelho**.
Testes no Vitest da raiz, em `__tests__/frontend/` (research R1: `@/` resolve pelo
`frontend/tsconfig.json`).

**Organização**: a spec não tem histórias numeradas; as seções do painel viram histórias, na ordem de
D1. Cada história troca **uma** seção do painel e deixa as demais como estão, então o painel funciona
entre uma história e outra.

| História | Seção | Prioridade | Requisitos |
|---|---|---|---|
| US1 | Pendências no topo | P1 (MVP) | RF-PEN-01..04, C1 |
| US2 | Indicadores em grupos | P1 | RF-IND-01..04, C2–C4, D7, D8 |
| US3 | Barra de status | P2 | RF-STA-01..03, C6, D9 |
| US4 | Funil | P2 | RF-FUN-01..03, C7 |
| US5 | Atividade recente | P3 | RF-ATV-01..02, C5 |
| US6 | Carregando e erro | P3 | RF-EST-04, C8 |

## Format: `[ID] [P?] [Story] Descrição com caminho`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência pendente)
- **[Story]**: US1…US6

## Regras de portão (todas as fases)

- Não tocar `app/`, `lib/` da raiz, `prisma/`, `package.json`/lockfiles, `vitest.config.ts`,
  `frontend/src/lib/data/dashboard.ts` nem `legacy/` (SC-02).
- Nenhuma cor em hex/`rgb(`; só classes de token, **escritas por extenso** em `tone.ts`
  (ui-contracts §4). Nada de `` `bg-${tom}` ``.
- Não usar `text-destructive` direto no painel (research R3: 3,08:1 no escuro).
- Não usar o modificador `/opacidade` sobre token (§8 do `CLAUDE.md`).
- Sem `page-canvas` e sem fundo por seção no painel (RF-EST-03).
- `routeTree.gen.ts` não muda (nenhuma rota nova); se o build regenerar, reverter.
- Commits na branch, `git commit -F <arquivo>`, com `Co-Authored-By`.

---

## Phase 1: Setup

**Purpose**: confirmar o ambiente antes de mexer em código.

- [x] T001 Conferir branch `011-reforma-visual-painel`, `node_modules` da raiz e de `frontend/` presentes, e rodar `npm test` na raiz para registrar a linha de base (esperado: só `__tests__/seed/organization-search-seed.test.ts` falha, sem `DATABASE_URL` no terminal); anotar o placar no `specs/011-reforma-visual-painel/ENTREGA.md`
- [x] T002 Rodar `npx tsc --noEmit` e `npm run build` em `frontend/` com o dev server **parado**, confirmando verde antes da mudança e `frontend/src/routeTree.gen.ts` inalterado

---

## Phase 2: Foundational (bloqueia todas as histórias)

**Purpose**: tokens, mapa de tom, módulo puro com os tipos e o componente extraído **sem mudança
visual**, protegido por um teste de não regressão.

- [x] T003 [P] Adicionar `--primary-muted`, `--primary-muted-foreground`, `--destructive-muted`, `--destructive-muted-foreground`, `--brand-muted`, `--brand-muted-foreground` em `:root` e `.dark` de `frontend/src/styles.css`, com os valores da tabela de research R2, e mapear os seis em `@theme inline` como `--color-<nome>: var(--<nome>)`, ao lado dos pares `success`/`warning`/`information`; nenhum token existente muda (RF-TOK-01)
- [x] T004 Criar `frontend/src/components/app/dashboard/tone.ts`, importando o tipo `Tone` de `@/lib/dashboard-visual` (T005), com os mapas literais `toneChipClass`, `toneBorderClass`, `toneFillClass` e `groupIconClass` (`primary` → `text-primary`, `information` → `text-information`, `brand` → `text-brand`) exatamente como a tabela de `contracts/ui-contracts.md` §4
- [x] T005 [P] Criar `frontend/src/lib/dashboard-visual.ts` só com os tipos de `data-model.md` (`IndicatorKey`, `IndicatorCard`, `GroupId`, `IndicatorGroup`, `VisiblePriorities`, `StatusSlice`, `FunnelRow`), as constantes `PRIORITY_VISIBLE_LIMIT = 5` e `FUNNEL_MIN_WIDTH = 4`, e `resolveHref` movida de `frontend/src/routes/_authenticated.dashboard.index.tsx` com o mesmo corpo; importar tipos de `./data/dashboard` e `./domain/enums`; o tipo `Tone` é definido e exportado aqui (o módulo puro não depende de componente)
- [x] T006 Criar `frontend/src/components/app/dashboard/OperationalDashboard.tsx` exportando `OperationalDashboard({ data })` com o JSX atual de `Dashboard` e `Mini` copiado **sem mudança visual**, usando `resolveHref` de `@/lib/dashboard-visual`; na rota `frontend/src/routes/_authenticated.dashboard.index.tsx`, remover `Dashboard`, `Mini` e `resolveHref` locais e renderizar `<OperationalDashboard data={dashboardQuery.data} />` (depende de T005)
- [x] T007 [P] Criar `__tests__/frontend/dashboard-fixtures.ts` com três fixtures tipadas como `OperationalDashboard` (import relativo de `../../frontend/src/lib/data/dashboard`): `organizacaoCheia` (os 9 indicadores com contagens > 0, inclusive `animalsSeekingFoster` e `animalsInFosterUnregistered`; 7 `priorityItems` cobrindo os 4 `PriorityKind`; os 4 status com contagens > 0; funil 3/2/1; 5 `recentActivity`, uma de cada `ActivityKind`, uma delas sem `href`; um indicador com `href` começando em `/dashboard/saude/agenda`), `acolhedor` (sem os 2 opcionais de LT) e `vazio` (tudo 0, listas vazias, sem os opcionais)
- [x] T008 Criar `__tests__/frontend/dashboard-render.test.ts` com `renderToStaticMarkup(createElement(OperationalDashboard, { data }))` e o bloco "não regressão": todo `href` de indicador de `organizacaoCheia` aparece no HTML depois de `resolveHref` (o de `/dashboard/saude/agenda` vira `/dashboard/saude`), e o HTML não contém `#` seguido de 3–6 hex nem `rgb(`; deve passar **verde** já com a extração de T006 (depende de T006, T007)

**Checkpoint**: painel idêntico ao de antes, rodando a partir de `components/app/dashboard/`, com tokens novos disponíveis e teste de não regressão verde.

---

## Phase 3: User Story 1 — Pendências no topo (P1, MVP)

**Goal**: a lista "O que precisa de atenção" vai para o topo, com chip, etiqueta escrita por tipo, corte em 5 e "Mostrar todas (N)"; vazio com ícone, sem emoji.

**Independent Test**: com `organizacaoCheia` (7 itens), o HTML mostra 5 itens, o botão "Mostrar todas (7)", as etiquetas "Atrasado", "Hoje", "Solicitação" e "Concluir adoção"; com `vazio`, "Nada pendente no momento." sem "🎉". No navegador, H5.

### Tests for User Story 1

- [x] T009 [US1] Em `__tests__/frontend/dashboard-visual.test.ts` (criar), bloco `visiblePriorities`: 7 itens recolhido → 5 visíveis na ordem original e `hiddenCount` 2; expandido → 7 e 0; 5 itens → 5 e 0; 0 itens → 0 e 0; e bloco `priorityKindMeta`: os 4 kinds com o tom e a etiqueta de RF-PEN-03. Rodar e ver **vermelho**
- [x] T010 [US1] Em `__tests__/frontend/dashboard-render.test.ts`, bloco "pendências": `organizacaoCheia` → título "O que precisa de atenção" aparece **antes** do primeiro rótulo de indicador no HTML, exatamente 5 itens de pendência, texto "Mostrar todas (7)", as 4 etiquetas; `vazio` → "Nada pendente no momento." e nenhum "🎉". Ver **vermelho**

### Implementation for User Story 1

- [x] T011 [US1] Implementar `visiblePriorities` e `priorityKindMeta` em `frontend/src/lib/dashboard-visual.ts` até T009 passar
- [x] T012 [US1] Criar `frontend/src/components/app/dashboard/PriorityList.tsx`: `h2` "O que precisa de atenção"; `ul` com cada item como `<a href={resolveHref(item.href)}>` contendo chip (`toneChipClass`) com ícone `aria-hidden` (`AlertTriangle`, `CalendarClock`, `Inbox`, `HandHeart` de `lucide-react`), etiqueta escrita, título, subtítulo e `formatarData(item.dueAt)` quando houver (no celular a data desce para baixo do subtítulo; em `sm`+ fica à direita); `useState` para expandir, botão `Button variant="ghost"` "Mostrar todas (N)" / "Mostrar menos" com `aria-expanded`; vazio com `CheckCircle2` `aria-hidden` em `text-success` + "Nada pendente no momento."; foco `focus-visible:ring-2 ring-ring ring-offset-2`; `motion-reduce:transition-none`
- [x] T013 [US1] Em `frontend/src/components/app/dashboard/OperationalDashboard.tsx`, remover a seção antiga de pendências e renderizar `<PriorityList items={data.priorityItems} />` como **primeira** seção, até T010 passar e T008 continuar verde

**Checkpoint**: MVP — pendências no topo, demais seções como antes.

---

## Phase 4: User Story 2 — Indicadores em grupos (P1)

**Goal**: três grupos (Adoção, Saúde, Lar temporário) com ícone e cor do grupo, chip por estado, "Requer ação" nos 3 cards de pendência com número > 0, mesmos `href`.

**Independent Test**: `organizacaoCheia` → 3 grupos, 9 cards, "Requer ação" 3 vezes; `acolhedor` → 2 grupos, 7 cards, nenhum "LT"/"Lar temporário"; `vazio` → nenhum "Requer ação". No navegador, H1, H2, H4.

### Tests for User Story 2

- [x] T014 [US2] Em `__tests__/frontend/dashboard-visual.test.ts`, blocos `requiresAction` (true só para `overdueHealthCare`, `requestsWaitingReview`, `animalsInFosterUnregistered` com count > 0; false com 0 e para qualquer outra chave) e `buildIndicatorGroups` (ONG → ids `adocao`,`saude`,`lt` com 4/3/2 cards na ordem da C2 e os tons de RF-IND-03; acolhedor → `adocao`,`saude`; só `animalsSeekingFoster` presente → grupo `lt` com 1 card; `href` já passado por `resolveHref`). Ver **vermelho**
- [x] T015 [US2] Em `__tests__/frontend/dashboard-render.test.ts`, bloco "indicadores": `organizacaoCheia` → títulos "Adoção", "Saúde", "Lar temporário", a ajuda "Em cuidados = ainda não anunciado" e "Requer ação" exatamente 3 vezes; `acolhedor` → sem "Lar temporário", "Procurando LT" ou "Em LT"; `vazio` → nenhum "Requer ação". Ver **vermelho**

### Implementation for User Story 2

- [x] T016 [US2] Implementar `requiresAction` e `buildIndicatorGroups` em `frontend/src/lib/dashboard-visual.ts` (rótulos iguais aos de hoje; ordem e tons da C2/RF-IND-03; grupo `lt` só com os opcionais presentes) até T014 passar
- [x] T017 [US2] Criar `frontend/src/components/app/dashboard/IndicatorGroups.tsx`: `h2` (pode ser `sr-only`) "Indicadores"; uma `section` por grupo com `h3` + ícone do grupo (`PawPrint`/`HeartPulse`/`House`, `aria-hidden`, `groupIconClass`); no grupo Adoção, a linha de ajuda em `text-muted-foreground`; grade `grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]`; cada card `<a href={card.href}>` com `Card`, chip (`toneChipClass`) com ícone `aria-hidden` de RF-IND-03, rótulo, número `font-serif tabular-nums` (em `text-muted-foreground` quando 0) e, se `requiresAction`, `border-2` + `toneBorderClass` e a etiqueta escrita "Requer ação"; no celular o card é horizontal (chip, rótulo, número à direita), em `sm`+ vertical; foco `focus-visible:ring-2 ring-ring ring-offset-2`; ordem de leitura rótulo → número → "Requer ação", sem `aria-label`
- [x] T018 [US2] Em `frontend/src/components/app/dashboard/OperationalDashboard.tsx`, trocar a grade antiga de indicadores por `<IndicatorGroups indicators={data.indicators} />` logo depois de `PriorityList`, até T015 passar e T008 continuar verde

**Checkpoint**: pendências + indicadores novos; status, funil e atividade ainda no formato antigo.

---

## Phase 5: User Story 3 — Barra de status (P2)

**Goal**: barra empilhada de 4 status com legenda escrita (número e %), itens da legenda como link para `/dashboard/animais?status=…`; total 0 com texto.

**Independent Test**: `organizacaoCheia` → 4 itens de legenda com os 4 `href`; `vazio` → "Nenhum animal cadastrado ainda.". No navegador, H6.

### Tests for User Story 3

- [x] T019 [US3] Em `__tests__/frontend/dashboard-visual.test.ts`, bloco `statusSlices`: ordem `EM_CUIDADOS`, `DISPONIVEL`, `EM_PROCESSO_ADOCAO`, `ADOTADO`; `fraction` e `percent` (arredondado) corretos para contagens 3/5/1/1; total 0 → todas as `fraction` 0 e nenhum `NaN`; `href` = `/dashboard/animais?status=<STATUS>`; `label` = `statusAnimalLabel`. Ver **vermelho**
- [x] T020 [US3] Em `__tests__/frontend/dashboard-render.test.ts`, bloco "status": `organizacaoCheia` → os 4 `href` de status e o texto de porcentagem; `vazio` → "Nenhum animal cadastrado ainda."; o HTML não contém mais `sm:grid-cols-5` (D9). Ver **vermelho**

### Implementation for User Story 3

- [x] T021 [US3] Implementar `statusSlices` em `frontend/src/lib/dashboard-visual.ts` até T019 passar
- [x] T022 [US3] Criar `frontend/src/components/app/dashboard/StatusBar.tsx`: `h2` "Meus animais por status"; barra `aria-hidden` `flex gap-0.5 h-3 rounded-full overflow-hidden bg-muted` com um segmento por fatia de count > 0, largura `style={{ width: \`${fraction * 100}%\` }}` (largura inline é dado, não cor) e cor `toneFillClass` (Em cuidados `neutral`, Disponível `primary`, Em processo `accent`→`bg-chart-2`, Adotado `success`); legenda `ul` com os 4 status sempre: bolinha da mesma cor `aria-hidden`, `<a href={slice.href}>` com "Rótulo · N (P%)", foco visível; total 0 → trilho vazio + "Nenhum animal cadastrado ainda."
- [x] T023 [US3] Em `frontend/src/components/app/dashboard/OperationalDashboard.tsx`, trocar a seção "Meus animais por status" por `<StatusBar counts={data.animalStatusCounts} />`, dentro de um contêiner `grid gap-6 lg:grid-cols-2` reservado para status + funil (C9), até T020 passar

**Checkpoint**: barra de status nova; o funil ainda antigo ocupa a outra metade do contêiner.

---

## Phase 6: User Story 4 — Funil (P2)

**Goal**: três barras horizontais com escala relativa ao maior valor, mínimo de 4% para valor > 0, números escritos; tudo zero com texto.

**Independent Test**: funil 3/2/1 → larguras 100/66,7/33,3; 0/0/0 → "Nenhuma solicitação nos últimos 30 dias.". No navegador, H3 e H1.

### Tests for User Story 4

- [x] T024 [US4] Em `__tests__/frontend/dashboard-visual.test.ts`, bloco `funnelRows`: 3/2/1 → `widthPercent` 100, ≈66,67, ≈33,33 e tons `primary`,`primary`,`success`; 50/1/0 → 100, 4 (mínimo), 0; 0/0/0 → 0,0,0 sem `NaN`; 1/5/2 (concluídas maiores que análise é possível) → 20, 100, 40; rótulos de RF-FUN-01. Ver **vermelho**
- [x] T025 [US4] Em `__tests__/frontend/dashboard-render.test.ts`, bloco "funil": `organizacaoCheia` → os 3 rótulos e os 3 números; `vazio` → "Nenhuma solicitação nos últimos 30 dias.". Ver **vermelho**

### Implementation for User Story 4

- [ ] T026 [US4] Implementar `funnelRows` em `frontend/src/lib/dashboard-visual.ts` até T024 passar (contribuição do Pedro no modo Learning: o cálculo de `widthPercent`)
- [x] T027 [US4] Criar `frontend/src/components/app/dashboard/AdoptionFunnel.tsx`: `h2` "Funil de adoção (30 dias)"; `ul` com uma linha por `FunnelRow`: rótulo à esquerda, número `tabular-nums` à direita, trilho `bg-muted h-2 rounded-full` com barra `aria-hidden` (`toneFillClass`, largura inline `widthPercent%`); tudo zero → trilhos vazios + "Nenhuma solicitação nos últimos 30 dias."; não clicável
- [x] T028 [US4] Em `frontend/src/components/app/dashboard/OperationalDashboard.tsx`, trocar a seção antiga do funil por `<AdoptionFunnel funnel={data.adoptionFunnel} />` no contêiner de T023 e apagar o componente `Mini`, até T025 passar

**Checkpoint**: status e funil lado a lado em `lg`, empilhados abaixo.

---

## Phase 7: User Story 5 — Atividade recente (P3)

**Goal**: atividade com chip de ícone por tipo; item com `href` vira link; seção some quando vazia.

**Independent Test**: `organizacaoCheia` → 5 itens, 4 links e 1 texto; `vazio` → sem "Atividade recente".

### Tests for User Story 5

- [x] T029 [US5] Em `__tests__/frontend/dashboard-visual.test.ts`, bloco `activityKindTone`: os 5 kinds com os tons de RF-ATV-02. Em `__tests__/frontend/dashboard-render.test.ts`, bloco "atividade": `organizacaoCheia` → título "Atividade recente", os `href` das 4 atividades que têm `href` e o texto da que não tem, sem `href` próprio; `vazio` → sem "Atividade recente". Ver **vermelho**

### Implementation for User Story 5

- [x] T030 [US5] Implementar `activityKindTone` em `frontend/src/lib/dashboard-visual.ts` e criar `frontend/src/components/app/dashboard/RecentActivity.tsx` (`h2`; `ul`; chip `toneChipClass` com `PawPrint`/`Stethoscope`/`Inbox`/`ThumbsUp`/`Heart` `aria-hidden`; texto do backend; `formatarData(occurredAt)`; `<a>` com foco visível só quando há `href`; retorna `null` se a lista for vazia)
- [x] T031 [US5] Em `frontend/src/components/app/dashboard/OperationalDashboard.tsx`, trocar a seção antiga por `<RecentActivity items={data.recentActivity} />` como última seção, até T029 passar

**Checkpoint**: todas as seções no formato novo.

---

## Phase 8: User Story 6 — Carregando e erro (P3)

**Goal**: esqueleto no formato do layout e erro com "Tentar de novo".

**Independent Test**: o render de `DashboardSkeleton` tem `aria-busy="true"` e "Carregando painel…" `sr-only`; no navegador, H7.

### Tests for User Story 6

- [x] T032 [US6] Em `__tests__/frontend/dashboard-render.test.ts`, bloco "esqueleto": `renderToStaticMarkup(createElement(DashboardSkeleton))` contém `aria-busy="true"` e "Carregando painel…", e exatamente 2 blocos de grupo (marcar cada bloco com `data-skeleton="grupo"`). Ver **vermelho**

### Implementation for User Story 6

- [x] T033 [US6] Criar `frontend/src/components/app/dashboard/DashboardSkeleton.tsx` com `Skeleton` de `@/components/ui/skeleton`: 3 linhas de pendência, 2 blocos de grupo (`data-skeleton="grupo"`) com 3–4 cards, barra e funil; contêiner com `aria-busy="true"` e `<span className="sr-only">Carregando painel…</span>`, até T032 passar
- [x] T034 [US6] Em `frontend/src/routes/_authenticated.dashboard.index.tsx`, trocar o texto de carregando por `<DashboardSkeleton />` e o parágrafo `text-destructive` por `Alert` de `@/components/ui/alert` com classes `bg-destructive-muted text-destructive-muted-foreground border-transparent`, ícone `CircleAlert` `aria-hidden`, a mesma mensagem de hoje e `Button` "Tentar de novo" que chama `dashboardQuery.refetch()`, desabilitado e com texto "Tentando…" enquanto `dashboardQuery.isFetching`; cabeçalho "Painel / Olá, {nome}!" visível nos dois estados; tela do ADMIN intacta

**Checkpoint**: funcionalidade completa.

---

## Phase 9: Polish, portão e homologação

- [x] T035 Revisar `frontend/src/components/app/dashboard/*.tsx` contra RF-A11Y: hierarquia `h1` → `h2` por seção → `h3` por grupo; todos os ícones com `aria-hidden`; foco visível em cards, itens, legenda, "Mostrar todas" e "Tentar de novo"; `motion-reduce:transition-none` nas transições; `git grep -nE "#[0-9a-fA-F]{3,6}\b|rgb\(|text-destructive\b|/[0-9]{2}\b" -- frontend/src/components/app/dashboard` sem ocorrência indevida
- [ ] T036 Portão (quickstart §3): `npx tsc --noEmit` na raiz; `npm test` (placar = linha de base de T001 + testes novos, mesma falha esperada); em `frontend/`, `npx tsc --noEmit` e `npm run build` com dev server parado; `git status --short frontend/src/routeTree.gen.ts` vazio; `git diff --stat main...HEAD -- app lib prisma package.json package-lock.json frontend/package.json frontend/package-lock.json vitest.config.ts` vazio (SC-02, SC-04)
- [ ] T037 Conferir que o `.env` não aponta para a produção (`npx prisma migrate status` e host do `DATABASE_URL`) e subir `npm run dev` (esperar responder) e `npm --prefix frontend run dev` (quickstart §4)
- [ ] T038 Homologar H1, H2, H4, H6 no navegador embutido com `organizacao.teste` e `acolhedor.teste` (todos os cards e itens da legenda clicados), registrando o resultado na tabela H do `specs/011-reforma-visual-painel/ENTREGA.md`
- [ ] T039 Homologar H3 (ONG nova cadastrada pela interface em `localhost:8080`; registrar o e-mail, não a senha) e H5 (criar cuidados atrasados no local se houver ≤ 5 pendências) no `ENTREGA.md`
- [ ] T040 Homologar H7 (backend parado → erro após os retries → backend de volta → "Tentar de novo"), H8 (claro e escuro) e H9 (375×812, 768×1024, desktop e 640×400 sem rolagem horizontal) no `ENTREGA.md`
- [ ] T041 Homologar H10 (teclado) e H11 (contraste na página real depois de `document.getAnimations()` esvaziar, com o critério da C14; se a borda `destructive` no escuro medir < 3:1, trocar por `border-destructive-muted-foreground` em `tone.ts` e remedir) no `ENTREGA.md`
- [ ] T042 H12: tirar os prints finais do painel da `organizacao.teste` (claro e escuro, desktop) e salvá-los em `specs/011-reforma-visual-painel/prints/` para a v21 e os slides
- [ ] T043 Fechar a documentação: preencher `specs/011-reforma-visual-painel/ENTREGA.md` (ondas com hash, decisões, não entregue, armadilhas, onde o código vive), status `Entregue` no índice de `specs/README.md` e a §10 do `CLAUDE.md` (última entrega = 011)
- [ ] T044 Push da branch e PR para `main` com o resumo, as SC e os prints; registrar o número do PR no `ENTREGA.md`; merge normal (sem migration, sem virada especial)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T002)** → **Foundational (T003–T008)** → histórias → **Polish (T035–T044)**.
- T004 e T006 dependem de T005; T008 depende de T006 e T007. T003, T005 e T007 em paralelo.

### User Story Dependencies

- Todas dependem só da Foundational. **Não** há dependência de dados entre histórias.
- Todas editam `OperationalDashboard.tsx`, `dashboard-visual.ts` e os dois arquivos de teste, por isso
  **não** são marcadas [P] entre si: rodar em sequência US1 → US2 → US3 → US4 → US5 → US6.
- US4 apaga `Mini` (T028); se US3 ainda usar `Mini`, fazer US3 antes (ordem acima já garante).
- US6 mexe só na rota e em `DashboardSkeleton.tsx`: pode ser feita a qualquer momento depois da
  Foundational sem conflito com US1–US5.

### Within Each User Story

- Teste unitário → teste de render → ver os dois **vermelhos** → módulo puro → componente → encaixe
  no `OperationalDashboard` → T008 continua verde.
- Commit ao fim de cada história.

### Parallel Opportunities

- T003, T005, T007 (arquivos diferentes); depois T004 e T006.
- US6 (T032–T034) em paralelo com qualquer história de US1–US5, por tocar arquivos diferentes —
  exceto o arquivo de teste de render: escrever T032 num bloco ao fim do arquivo, sem editar os outros.
- Homologações T038–T041 compartilham os servidores: sequenciais.

---

## Parallel Example: Foundational

```text
Task: "T003 Tokens -muted em frontend/src/styles.css"
Task: "T007 Fixtures em __tests__/frontend/dashboard-fixtures.ts"
Task: "T005 Tipos e resolveHref em frontend/src/lib/dashboard-visual.ts"
```

## Parallel Example: US6 ao lado de US2

```text
Task: "T017 IndicatorGroups.tsx"            # US2
Task: "T033 DashboardSkeleton.tsx"          # US6, arquivo diferente
```

---

## Implementation Strategy

### MVP (US1)

Setup + Foundational + US1: o painel já mostra o que exige ação no topo, com marcação por tipo, e o
resto continua como antes. É demonstrável e seguro para parar.

### Entrega incremental

US2 (indicadores) é a mudança mais visível depois do MVP. US3 e US4 fecham a parte de gráficos. US5 e
US6 são acabamento. Prazo: tudo até 01/11/2026 (SC-06).

---

## Rastreabilidade (requisito → tarefas)

| Requisito | Tarefas |
|---|---|
| RF-EST-01, RF-EST-02 | T006, T013, T018, T023, T028, T031 |
| RF-EST-03 | regra de portão, T035 |
| RF-EST-04 / C8 | T032–T034, T040 |
| RF-PEN-01..04 / C1 | T009–T013, T039 |
| RF-IND-01..04 / C2–C4, D7, D8 | T014–T018, T038 |
| RF-STA-01..03 / C6, D9 | T019–T023, T038 |
| RF-FUN-01..03 / C7 | T024–T028 |
| RF-ATV-01..02 / C5 | T029–T031 |
| RF-TOK-01 / C3 | T003, T004 |
| RF-A11Y-01..06 / C10, C14 | T012, T017, T022, T035, T041 |
| SC-01, SC-02, SC-03 | regras de portão, T008, T035, T036 |
| SC-04 | T036 |
| SC-05 | T041 |
| SC-06 | estratégia, T044 |

## Notes

- `tasks.md` em UTF-8 sem BOM; conferir caracteres nulos ao marcar, contando os bytes `0x00` com Python (`git grep`/`grep` com
  `$'\x00'` vira padrão vazio e casa toda linha — falso positivo).
- Marcar `[x]` a cada tarefa concluída, com o hash do commit no `ENTREGA.md` ao fim de cada história.
- Modo Learning: em T026 o cálculo de `widthPercent` fica como `TODO(human)` para o Pedro escrever.
- Se uma tarefa contradisser o código real, o código manda: registrar a divergência no `ENTREGA.md` §3
  (como a 009 fez com T052/T054/T069/T073) e seguir.
