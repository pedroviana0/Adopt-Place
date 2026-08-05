# Tasks: Reforma de UI/UX do AdoptPlace

**Input**: `spec.md`, `plan.md`, `research.md`, `quickstart.md`, `contracts/ui-patterns.md` e `docs/audits/004-ui-ux-audit.md`
**Regra de propriedade**: Arthur é o único editor de `frontend/src/styles.css`, `frontend/src/components/app/Navbar.tsx`, shells e `frontend/src/components/ui/` enquanto a onda correspondente estiver aberta. Pedro não os edita simultaneamente.

## Phase 1 — Baseline e gates

- [X] T001 [US5] [PEDRO] Completar a matriz preparada em `specs/004-ui-ux-redesign/quickstart.md` com uma linha por rota, papel, controle/estado, viewport 375/1024/1440, zoom, data e caminho de evidência antes da primeira mudança visual (FR-003, SC-001–SC-003).
- [X] T002 [US5] [PEDRO] Capturar baseline renderizada da população nomeada em `specs/004-ui-ux-redesign/quickstart.md` em `docs/audits/004-ui-ux-baseline/`, com sessão/evidência separada para visitante, adotante, organização, acolhedor independente e administrador, sem dados privados (FR-003/NFR-004).
- [X] T003 [US5] [PEDRO] Registrar em `specs/004-ui-ux-redesign/quickstart.md` a baseline de contratos/rotas da feature 003 a preservar, referenciando `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md`, para FR-016/FR-017.
- [X] T004 [US5] [PEDRO] Executar e registrar gate pré-implementação em `specs/004-ui-ux-redesign/quickstart.md`: `git diff --check`, builds/tipos disponíveis, débito CRLF/Prettier e ausência de mudança em `app/`, `lib/` e `prisma/` (FR-016/FR-017, CR-002, CR-003, CR-004, CR-005, CR-006, CR-007).

## Phase 2 — Fundação visual e tokens

- [X] T005 [US5] [ARTHUR] Após T001–T004, inventariar usos de cor, tipografia, raio, sombra e foco em `frontend/src/styles.css` e `frontend/src/components/ui/` e documentar somente padrões exigidos por duas jornadas ou requisito atual em `specs/004-ui-ux-redesign/contracts/ui-patterns.md` (UX-06, FR-013–FR-015, CR-001).
- [X] T006 [US5] [ARTHUR] Definir tokens semânticos de superfície, sucesso, aviso, erro, informação, seleção e foco em `frontend/src/styles.css`, preservando verde oliva primário e terracota discreta (UX-06, FR-013/FR-015).
- [X] T007 [US5] [ARTHUR] Aplicar foco visível contínuo e estados disabled/selected às primitives afetadas em `frontend/src/components/ui/button.tsx`, `frontend/src/components/ui/input.tsx`, `frontend/src/components/ui/select.tsx`, `frontend/src/components/ui/dialog.tsx`, `frontend/src/components/ui/dropdown-menu.tsx` e `frontend/src/components/ui/sheet.tsx` (UX-10, FR-014/FR-015).
- [X] T008 [US5] [PEDRO] Verificar contrastes dos tokens e estados definidos em `frontend/src/styles.css` e registrar resultados AA na matriz de `specs/004-ui-ux-redesign/quickstart.md` (UX-06/UX-10, SC-007).
- [X] T009 [US5] [ARTHUR] Executar o procedimento manual “Primitives e foco” de `specs/004-ui-ux-redesign/quickstart.md` após T006–T007, registrando os cinco papéis, rota, controle, estado, viewport, ordem/restauração de foco, nome acessível, resultado e evidência; não criar teste de componente incompatível com `vitest.config.ts` (FR-014/FR-015/FR-019).

## Phase 3 — Navegação e shells responsivos

**Goal**: US1 — todos os destinos autorizados permanecem alcançáveis.

- [X] T010 [US1] [ARTHUR] Implementar menu mobile modal/lateral por papel em `frontend/src/components/app/Navbar.tsx`, reutilizando primitive existente e preservando destinos de visitante, adotante, organização, acolhedor independente e administrador (UX-01, FR-001/FR-002).
- [X] T011 [US1] [ARTHUR] Ajustar foco, fechamento e retorno ao gatilho do menu em `frontend/src/components/app/Navbar.tsx` e primitive selecionada em `frontend/src/components/ui/`, para SC-001/SC-003.
- [X] T012 [US1] [ARTHUR] Corrigir navegação responsiva do dashboard em `frontend/src/routes/_authenticated.dashboard.tsx` para manter todos os destinos em 375 px sem rolagem horizontal involuntária (UX-08, FR-001/FR-011).
- [X] T013 [US1] [ARTHUR] Ajustar shell global e rodapé em `frontend/src/routes/__root.tsx` para compatibilidade com navegação/foco e larguras-alvo (FR-001, NFR-001).
- [ ] T014 [PEDRO] [US1] Executar roteiro manual de teclado em Navbar e dashboard shell para visitante, adotante, organização, acolhedor independente e administrador, com sessões, destinos e evidências separados na matriz de `specs/004-ui-ux-redesign/quickstart.md` (SC-001/SC-003).

## Phase 4 — Estados assíncronos, confirmação e compartilhados

**Goal**: US2 — ações e listas comunicam estado e evitam erro acidental.

- [X] T015 [US2] [ARTHUR] Criar `frontend/src/components/app/AsyncState.tsx` como padrão reutilizável de loading, vazio e erro, consumindo `frontend/src/components/app/EmptyState.tsx` onde apropriado (UX-03/UX-04, FR-006/FR-007).
- [X] T016 [US2] [ARTHUR] Criar `frontend/src/components/app/ConfirmDestructiveAction.tsx` para confirmação destrutiva contextual, usando primitive existente e sem mudar mutações (UX-02, FR-004/FR-005).
- [ ] T017 [US2] [ARTHUR] Executar o procedimento manual “Confirmação destrutiva” de `specs/004-ui-ux-redesign/quickstart.md` para organização, acolhedor e administrador, em sessões separadas quando a ação for autorizada, registrando rota, item, controle, viewport, cancelamento, confirmação, foco restaurado e evidência; não criar teste de componente incompatível com `vitest.config.ts` (UX-02, SC-004).
- [X] T018 [US2] [ARTHUR] Migrar o estado vazio reutilizável em `frontend/src/components/app/EmptyState.tsx` para garantir descrição e próxima ação opcional sem alterar regras de rota (UX-03, FR-007).
- [ ] T019 [PEDRO] [US2] Executar roteiro manual de sucesso, erro recuperável, cancelamento e confirmação em `/dashboard/documentos` e `/dashboard/admin/usuarios`, com evidência separada para organização, acolhedor e administrador quando autorizados, registrando 0 mutações no cancelamento (SC-004/SC-006).

## Phase 5 — Home, vitrine, filtros, cards e detalhe público

**Goal**: US3 — descoberta pública clara e estável.

- [X] T020 [US3] [ARTHUR] Criar `frontend/src/components/app/AnimalShowcaseSkeleton.tsx` para skeleton de filtros/grade com estrutura compatível aos resultados finais (UX-04, FR-008/SC-005).
- [X] T021 [US3] [ARTHUR] Tratar em `frontend/src/components/app/PublicAnimalCard.tsx` foto real com texto alternativo, ausência conhecida com placeholder neutro e falha de carregamento distinta, sem conteúdo fictício ou mudança de Uploadthing (UX-05, FR-010/FR-019).
- [X] T022 [US3] [ARTHUR] Implementar feedback verificável de loading, erro, filtros ativos, limpeza e vazio recuperável em `frontend/src/components/app/AnimalFilters.tsx` sem mudar `frontend/src/lib/data/catalogos.ts` ou contratos (UX-07, FR-006/FR-009/FR-012/FR-019).
- [X] T023 [US3] [ARTHUR] Aplicar à home em `frontend/src/routes/index.tsx` skeleton que preserve filtros e slots da grade durante o carregamento (UX-04, FR-008/SC-005).
- [X] T024 [ARTHUR] [P] [US3] Aplicar à vitrine em `frontend/src/routes/vitrine.tsx`, após T020–T022, skeleton que preserve filtros/grade e estados de vazio/erro recuperável (UX-03/UX-04/UX-07, FR-006–FR-009).
- [X] T025 [ARTHUR] [P] [US3] Reorganizar o detalhe em `frontend/src/routes/animais.$animalId.tsx` para 375/1024/1440 e 200% de zoom, com foco conforme T006–T007 e DTO público preservado (FR-014–FR-016, NFR-001/NFR-002).
- [ ] T026 [US3] [ARTHUR] Executar o procedimento manual “Descoberta pública” de `specs/004-ui-ux-redesign/quickstart.md`, registrando loading, filtro, vazio, foto real, ausência conhecida, falha de imagem, texto alternativo, viewport e captura antes/depois; não criar teste de componente incompatível com `vitest.config.ts` (UX-03–UX-05, SC-005–SC-007).
- [ ] T027 [PEDRO] [US3] Executar roteiro manual público em `/`, `/vitrine` e `/animais/$animalId`: 375/1024/1440, loading/skeleton, filtro ativo/limpeza, vazio, foto real, ausência e falha de imagem; registrar comparação (SC-002/SC-005–SC-007).

## Phase 6 — Jornadas do adotante

**Goal**: US4 — jornadas autenticadas responsivas sem mudança de contrato.

- [X] T028 [US4] [ARTHUR] Adaptar layout, estados e formulário de `/meu-perfil` em `frontend/src/routes/_authenticated.meu-perfil.tsx` para 375/1024/1440, preservando validação e contratos atuais (FR-011/FR-016/FR-018/FR-019).
- [X] T029 [ARTHUR] [P] [US4] Adaptar layout, feedback e formulário de `/triagem` em `frontend/src/routes/_authenticated.triagem.tsx` após T015, preservando validação atual (FR-006/FR-011/FR-018/FR-019).
- [X] T030 [ARTHUR] [P] [US4] Adaptar vazio/erro/lista de `/meus-favoritos` em `frontend/src/routes/_authenticated.meus-favoritos.tsx` após T015 e T018 (FR-007/FR-011).
- [X] T031 [ARTHUR] [P] [US4] Adaptar lista e estados de `/minhas-solicitacoes` em `frontend/src/routes/_authenticated.minhas-solicitacoes.tsx` sem alterar query keys ou DTOs (FR-006/FR-011/FR-016).
- [X] T032 [US4] [ARTHUR] Adaptar lista e conversa do adotante em `frontend/src/routes/_authenticated.mensagens.index.tsx` e `frontend/src/routes/_authenticated.mensagens.$conversaId.tsx`, preservando estado arquivado somente leitura (FR-011/FR-016).
- [ ] T033 [PEDRO] [US4] Executar regressão manual de adotante em perfil, triagem, favoritos, solicitação e chat ativo/arquivado, incluindo formulário/erro/foco e viewport documentados em `specs/004-ui-ux-redesign/quickstart.md` (SC-001–SC-009).

## Phase 7 — Jornadas de organização/acolhedor

**Goal**: US4 — operações de organização e acolhedor com evidências separadas, sem mudança de permissão ou contrato.

- [X] T034 [US4] [ARTHUR] Adaptar lista e formulário de animais em `frontend/src/routes/_authenticated.dashboard.animais.index.tsx`, `frontend/src/routes/_authenticated.dashboard.animais.novo.tsx` e `frontend/src/components/app/AnimalForm.tsx`, preservando upload, taxonomia, Zod, rótulos, erros e foco atuais (FR-006/FR-011/FR-016/FR-018/FR-019).
- [X] T035 [ARTHUR] [P] [US4] Adaptar fotos e relações em `frontend/src/components/app/AnimalPhotosPanel.tsx` e `frontend/src/components/app/RelatedAnimalsPanel.tsx`, preservando Uploadthing, ordenação e ações existentes (FR-011/FR-016).
- [X] T036 [ARTHUR] [P] [US4] Adaptar solicitações recebidas em `frontend/src/routes/_authenticated.dashboard.solicitacoes.index.tsx` e `frontend/src/routes/_authenticated.dashboard.solicitacoes.$solicitacaoId.tsx` com estados compartilhados (FR-006/FR-011).
- [X] T037 [ARTHUR] [P] [US4] Adaptar saúde em `frontend/src/routes/_authenticated.dashboard.saude.index.tsx`, consumindo estados compartilhados sem alterar contratos; validar separadamente loading, vazio, erro e ações existentes (UX-03, FR-006/FR-007/FR-011).
- [X] T053 [ARTHUR] [P] [US4] Adaptar documentos em `frontend/src/routes/_authenticated.dashboard.documentos.index.tsx`, consumindo T016 e T018 sem alterar contrato; validar separadamente lista, vazio/erro, exclusão contextual e foco restaurado (UX-02/UX-03, FR-004–FR-007/FR-011).
- [ ] T038 [ARTHUR] [P] [US4] Adaptar mensagens de organização e acolhedor em `frontend/src/routes/_authenticated.dashboard.mensagens.index.tsx` e `frontend/src/routes/_authenticated.dashboard.mensagens.$conversaId.tsx`, preservando chat arquivado (FR-011/FR-016).
- [ ] T039 [PEDRO] [US4] Executar regressão manual separada de organização e acolhedor independente: criar/editar animal e foto, solicitação, saúde, documento, chat, formulário, erro e cancelamento; registrar permissões/destinos e evidências próprias em `specs/004-ui-ux-redesign/quickstart.md` (SC-004/SC-006/SC-008/SC-009).

## Phase 8 — Administração e listas densas

**Goal**: US4 — administração responsiva e segura sem ampliar backend.

- [ ] T040 [US4] [ARTHUR] Estruturar lista de usuários em desktop compacto e mobile por linha/card em `frontend/src/routes/_authenticated.dashboard.admin.usuarios.tsx`, usando apenas campos do contrato ADMIN-01 (UX-09, FR-011/FR-012/FR-016).
- [ ] T041 [US4] [ARTHUR] Conectar desativação/reativação de `frontend/src/routes/_authenticated.dashboard.admin.usuarios.tsx` ao componente T016, sem adicionar busca/filtro sem suporte atual (UX-02/UX-09, FR-004/FR-012).
- [ ] T042 [PEDRO] [US4] Executar roteiro manual admin em `/dashboard/admin/usuarios`: 375/1024/1440, estado, confirmação, cancelamento, toggle e foco; registrar resultado (SC-001–SC-004).

## Phase 9 — Acessibilidade, responsividade e regressão

**Goal**: US5 — consistência transversal mensurável.

- [ ] T043 [PEDRO] [US5] Auditar teclado, nome acessível e foco inicial/contido/restaurado em 100% das rotas e controles enumerados na matriz de `specs/004-ui-ux-redesign/quickstart.md`, registrando papel, viewport, sequência e resultado (UX-01/UX-10, FR-019, SC-001/SC-003).
- [ ] T044 [PEDRO] [US5] Auditar zoom 200%, rolagem horizontal e alvo de toque/pointer em toda a população de rotas de `specs/004-ui-ux-redesign/quickstart.md` (NFR-001/NFR-002, SC-002).
- [ ] T045 [PEDRO] [US5] Auditar e registrar em `specs/004-ui-ux-redesign/quickstart.md` texto/superfície (4,5:1), texto grande, limites de controles, foco e componentes gráficos essenciais (3:1), além de ação primária, erro, aviso, sucesso, informação, seleção e disabled aplicável; verificar em cada estado uma pista adicional à cor (UX-06/UX-10, FR-013–FR-015, SC-007).
- [ ] T046 [PEDRO] [US5] Executar leitor de tela quando disponível, com sessões separadas dos cinco perfis, nos fluxos de menu, formulário, filtro/card, chat, upload, diálogo e lista definidos em `specs/004-ui-ux-redesign/quickstart.md`; se indisponível, registrar revisão de HTML/ARIA/ordem e pendência assistiva explícita (NFR-003/FR-019).
- [ ] T047 [US5] [ARTHUR] Corrigir somente achado previamente registrado por T043–T046 na matriz final de `specs/004-ui-ux-redesign/quickstart.md`, após registrar rota, arquivo existente, requisito, evidência anterior e critério esperado; proibir refatoração oportunista, formatação massiva e alteração fora do escopo (FR-014–FR-017).
- [ ] T048 [PEDRO] [US5] Rodar validações automatizadas e regressão 003: `npm test`, typecheck, lint, Prisma validate, build raiz, build frontend, lint focado e roteiro dos formulários; separar débito CRLF/Prettier e confirmar TypeScript strict/ausência de `any` novo em `specs/004-ui-ux-redesign/quickstart.md` (SC-008/SC-009, CR-008).

## Phase 10 — Documentação, homologação e encerramento

- [ ] T049 [US5] [PEDRO] Comparar screenshots baseline/pós em `docs/audits/004-ui-ux-baseline/` e registrar diferenças/aceite em `specs/004-ui-ux-redesign/quickstart.md` (FR-003, SC-002–SC-007).
- [ ] T050 [US5] [PEDRO] Atualizar rastreabilidade UX → FR/SC → evidências em `specs/004-ui-ux-redesign/spec.md` e `specs/004-ui-ux-redesign/tasks.md`, garantindo cobertura UX-01…UX-10.
- [ ] T051 [US5] [PEDRO] Atualizar `specs/004-ui-ux-redesign/quickstart.md` com evidência final por papel, contratos preservados, rollback aplicado se houver e limitações restantes (FR-016/FR-017).
- [ ] T052 [US5] [PEDRO] Executar revisão de escopo e `git diff --check`, confirmando ausência de mudança funcional em `app/`, `lib/`, `prisma/`, migrations, seeds, autenticação, autorização, contratos HTTP, Uploadthing, regras de negócio e `legacy/frontend-antigo/` (FR-016/FR-017, CR-002, CR-003, CR-004, CR-005, CR-006, CR-007).

## Dependencies and Parallel Opportunities

| Tarefa ou grupo | Depende de | Arquivos compartilhados / dono temporário | Pode paralelizar com | Gate de integração e risco |
|---|---|---|---|---|
| T001–T004 | nenhum | documentação / Pedro | nenhum antes da baseline | baseline, contratos e escopo registrados; bloqueia fundação visual |
| T005–T009 | T001–T004 | `frontend/src/styles.css`, `frontend/src/components/ui/` / Arthur | nenhum que altere tokens ou primitives | C1; risco alto de conflito, Arthur é editor único |
| T010–T014 | T005–T009 | `frontend/src/components/app/Navbar.tsx`, `frontend/src/routes/__root.tsx`, `frontend/src/routes/_authenticated.dashboard.tsx` / Arthur | T015–T019 somente após C1 | T010–T013 são serializadas; T014 fecha C2N de destinos/foco |
| T015–T019 | T005–T009 | `frontend/src/components/app/AsyncState.tsx`, `frontend/src/components/app/ConfirmDestructiveAction.tsx`, `frontend/src/components/app/EmptyState.tsx` / Arthur | T010–T014 e T025, após C1 | T015–T018 são serializadas se compartilharem arquivo; T019 fecha C2S de estado/confirmação |
| T020–T021 | C1 | `frontend/src/components/app/AnimalShowcaseSkeleton.tsx`, `frontend/src/components/app/PublicAnimalCard.tsx` / Arthur | T010–T019 e T025, se não alterarem esses arquivos | componentes público independentes; revisão antes dos consumidores |
| T022–T024 | T015, T018 e, para T023–T024, C2N/T020–T022 conforme citado na própria tarefa | `frontend/src/components/app/AnimalFilters.tsx`, `frontend/src/components/app/AnimalShowcaseSkeleton.tsx` / Arthur | T025 e jornadas autenticadas em arquivos distintos | T024 somente após T020–T022; C3 não fecha antes de T026–T027 |
| T026–T027 | T023–T025 | somente evidências e `specs/004-ui-ux-redesign/quickstart.md` / Arthur em T026, Pedro em T027 | nenhuma edição concorrente do mesmo registro de evidência | serializar a escrita da evidência; fecha C3 |
| T025 | T006–T007 e C2N | `frontend/src/routes/animais.$animalId.tsx` / Arthur | T015–T024, T028–T042/T053 | rota isolada; não depende de todos os estados assíncronos |
| T028–T032 | C2N; T029/T031–T032 dependem de T015 e T030 depende de T015/T018 | rotas do adotante / Arthur | T034–T038/T053 em arquivos distintos | regressão T033 antes de C4; sem alterar componentes compartilhados |
| T034–T035 | C2N | `frontend/src/components/app/AnimalForm.tsx`, `frontend/src/components/app/AnimalPhotosPanel.tsx`, `frontend/src/components/app/RelatedAnimalsPanel.tsx` / Arthur | T028–T032 e T036–T038/T053 em arquivos distintos | risco de conflito entre painel/formulário: Arthur serializa se o diff tocar arquivo comum |
| T036–T038 | C2N; T015 e T018 quando houver vazio | rotas de solicitações, saúde e mensagens / Arthur | T028–T035/T053 em arquivos distintos | cada rota é revisável separadamente; regressão dos dois papéis antes de C4 |
| T053 | C2N, T015, T016 e T018 | `frontend/src/routes/_authenticated.dashboard.documentos.index.tsx` e confirmação compartilhada / Arthur | T028–T038 se não alterarem confirmação | documentos e saúde permanecem revisões separadas; exige T019 antes de C4 |
| T040–T042 | C2N, T016 e T018 | `frontend/src/routes/_authenticated.dashboard.admin.usuarios.tsx` / Arthur | rotas do adotante, organização e acolhedor, não T041 com T040 | lista e confirmação aprovadas; mesmo arquivo serializado |
| T043–T047 | ondas de rota concluídas | arquivos anotados na matriz / Arthur somente em T047 | T048 após evidências completas | T047 só atua em achado registrado; sem escopo aberto |
| T048–T052 | T043–T047 e comparação final | documentação / Pedro | T049–T052 por artefato distinto após T048 | C5; preservação de contratos e diff de escopo |

US1 (T010–T014) e US2 (T015–T019) compõem o MVP. Uma tarefa só usa `[P]` quando seus caminhos editados não coincidem com os de outra tarefa concorrente; qualquer mudança em tokens, Navbar, shell ou primitives suspende o paralelismo dessas áreas.

## Pedro × Arthur Recommended Sequence

1. Pedro executa T001–T004; Arthur executa T005–T007; Pedro executa T008 e libera o registro antes de Arthur executar T009, evitando edição simultânea de `specs/004-ui-ux-redesign/quickstart.md`.
2. Arthur serializa T010–T013 e T015–T018; Pedro executa T014/T019 após cada gate.
3. Arthur divide público, adotante, organização e acolhedor apenas por arquivos distintos; Pedro valida cada jornada concluída antes da próxima onda.
4. Pedro conduz QA, comparação e encerramento; Arthur corrige somente achados reproduzíveis.

## Checkpoints

- **C1** após T009: tokens/foco/AA base aprovados.
- **C2N** após T014: navegação e shells aprovados por teclado.
- **C2S** após T019: estados e confirmação aprovados; cancelamento registra 0 mutações.
- **C3** após T027: descoberta pública e screenshots aprovados.
- **C4** após T033/T039/T042: regressões por papel aprovadas.
- **C5** após T052: SC-001…SC-009, diff de escopo e comparação final aprovados.

## UX → requisito → critério → plano → tarefa → validação

| UX | Requisito | Critério | Onda do plano | Tarefas | Validação |
|---|---|---|---|---|---|
| UX-01 | FR-001/FR-002 | SC-001 | 2 e 8 | T010–T014, T043 | matriz de teclado por cinco perfis |
| UX-02 | FR-004–FR-006 | SC-004 | 3, 6 e 7 | T016–T019, T041, T053 | procedimento de confirmação por organização, acolhedor e administrador |
| UX-03 | FR-006/FR-007 | SC-006 | 3–6 | T015, T018, T023–T024, T030, T037, T053 | matriz de vazio/erro por rota |
| UX-04 | FR-006/FR-008 | SC-005 | 3 e 4 | T015, T020, T023–T026 | procedimento público de loading/skeleton |
| UX-05 | FR-010 | SC-007 | 4 | T021, T026–T027 | foto real, ausência e falha em card/detalhe com captura comparável |
| UX-06 | FR-013/FR-015 | SC-007 | 1 e 8 | T005–T009, T045 | matriz de contraste semântico |
| UX-07 | FR-006/FR-009 | SC-006 | 4 | T022–T024, T027 | filtro, vazio e recuperação |
| UX-08 | FR-001/FR-011 | SC-002 | 2 e 8 | T012–T014, T044 | três viewports e zoom 200% |
| UX-09 | FR-011/FR-012 | SC-002 | 7 e 8 | T040–T042, T044 | lista admin desktop/mobile |
| UX-10 | FR-014/FR-015 | SC-003 | 1, 2 e 8 | T006–T011, T043–T047 | foco, alvo, teclado e leitor de tela |

## MVP and Incremental Delivery

MVP: T001–T019, que entrega baseline, foco/tokens, navegação responsiva e confirmação segura. Em seguida entregar público (T020–T027), adotante (T028–T033), organização/acolhedor (T034–T039 e T053), admin (T040–T042) e QA/encerramento (T043–T052). Cada incremento tem rollback isolado no frontend e regressão de contrato correspondente.
