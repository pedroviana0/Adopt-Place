# Entrega — Spec 009: Lar temporário e reforma do status

| | |
|---|---|
| **Período** | 2026-10-14 → — |
| **Branch** | `009-lar-temporario-status` |
| **PRs** | [#137](https://github.com/pedroviana0/Adopt-Place/pull/137) (aberto, **sem merge** até a migration em produção) |
| **Status** | EM HOMOLOGAÇÃO: código, homologação H1–H13 e PR prontos; faltam o ensaio no `validacao-009` e a virada (tarefas do Pedro) |
| **Spec** | [`spec.md`](spec.md) |

Execução: Pedro, sozinho, com acordo do Arthur (mantenedor) registrado em 2026-10-14.

## 1. O que a spec promete

| Fase | Conteúdo | Estado |
|---|---|---|
| 1 | Migration e remoção de `RESGATADO` | Concluída (`fd8f99c`); migrations aplicadas no `dev-009` pelo Pedro |
| 2 | Backend (regra de LT, API de LT, tratamento, dashboard) | Concluída (`e708562`) |
| 3 | Frontend | Concluída em código (`213854c`); homologação visual na Fase 4 |
| 4 | Testes, seed e homologação | Concluída, menos o ensaio no `validacao-009` (T087/T088) e a limpeza dos branches Neon (T092). Seed no `seed-009`; H1–H13 aprovados com 5 correções (`3602799`, `79d5fc7`, `b809180`, `a2c7553`, merge `ca1dd32`) |
| 5 | Documentação, PR e virada | Documentação e PR feitos; virada (T097/T098) e T099–T101 com o Pedro |

## 2. O que foi entregue

### Fase 1 — migration e remoção de `RESGATADO` (commit `fd8f99c`)

- `prisma/schema.prisma`: `StatusAnimal` sem `RESGATADO`, `@default(EM_CUIDADOS)`; enum `SituacaoLT`;
  `Animal.situacaoLT`, `Animal.larTemporarioId` (FK `SET NULL`); model `LarTemporario` (FK
  `CASCADE` para `Organizacao`).
- `prisma/migrations/20261014180000_status_sem_resgatado/migration.sql`: gerada por
  `prisma migrate diff`, mais o `UPDATE … 'RESGATADO' → 'EM_CUIDADOS'` escrito à mão logo depois do
  `BEGIN;`.
- `prisma/migrations/20261014180100_lar_temporario/migration.sql`: gerada sem edição.
- `scripts/verify-009-migration.ts`: verificador read-only das invariantes I1–I4.
- Backend (`statusInitial`), frontend (`enums.ts`, `schemas/animal.ts`, `StatusBadge.tsx`) e
  fixtures de 3 arquivos de teste sem `RESGATADO`.

**Validação (2026-10-14, worktree sem `.env`, logo sem acesso a banco nenhum):**
- `prisma validate` OK (com URL fictícia de localhost, só para satisfazer a variável);
- `prisma generate` OK;
- `tsc` OK no backend e no frontend;
- build do frontend OK; `routeTree.gen.ts` inalterado;
- `git grep RESGATADO` (fora de `legacy/`, `specs/`, migrations e `contextospecs_v2.md`) vazio;
- `npm test`: **366/367**. A falha é `__tests__/seed/organization-search-seed.test.ts`, que precisa de
  `DATABASE_URL` real; é só leitura e não depende desta mudança. Deve passar com o `.env` no
  `dev-009` (T001).

**Fechamento da Fase 1:** o Pedro fez T001 (branch `dev-009`, `.env` apontado) e T007
(`migrate deploy`). Conferido em 2026-10-14: `prisma migrate status` no host do `.env` mostra 7
migrations, as duas da 009 incluídas, e "Database schema is up to date". Como a produção só recebe
migration em T097, isso também confirma que o `.env` não aponta para a produção.

### Fase 2 — backend (commit `e708562`)

- `lib/lar-temporario.ts`:
  - `resolveFosterState`: campo ausente mantém o valor; acolhedor sem LT; `ADOTADO` zera; vínculo
    exige `EM_LT` e LT da própria ONG;
  - `FOSTER_RESET_ON_ADOPTION`;
  - `pendingTreatmentCareWhere` e `inTreatmentWhere`, a regra única de "em tratamento".
- Reset de LT nos **três** caminhos até `ADOTADO`:
  - `completeAdoption`, no mesmo `updateMany` condicional;
  - `updateAnimal`;
  - `updateAnimalStatus`.

  `createAnimal` e `updateAnimal` passam pela mesma regra.
- `lib/schemas/animal.ts`: `situacaoLT` e `larTemporarioId` opcionais.
- API `/api/lares-temporarios`:
  - rotas `route.ts`, `vinculaveis`, `[id]`, `[id]/animais` e `[id]/animais/[animalId]`;
  - `requireActiveOrganization` em `lib/api/responsible-http.ts`;
  - schemas em `lib/schemas/lar-temporario.ts`, consultas em `lib/queries/lares-temporarios.ts` e
    actions em `lib/actions/lares-temporarios.ts`.
- Gestão de animais:
  - o DTO ganha `situacaoLT`, `larTemporario { id, nomeTutor }` e `emTratamento`;
  - filtros `lt` (com `EM_LT_SEM_VINCULO`) e `tratamento=1`;
  - `lt` vindo de acolhedor responde 400.
- Dashboard: `animalsInTreatment` e, só para ONG, `animalsSeekingFoster` e
  `animalsInFosterUnregistered`.

**Validação (2026-10-14):**
- todos os testes novos foram escritos antes e vistos **vermelhos** antes da implementação;
- `npm test`: **419/420**. A falha é a mesma de antes (`organization-search-seed.test.ts`), agora
  explicada na seção 5;
- `tsc` OK no backend e no frontend;
- build do frontend OK; `routeTree.gen.ts` inalterado.

### Fase 3 — frontend (commit `213854c`)

- `AnimalForm`:
  - ajuda dinâmica sob o Status (`statusAnimalHelp`);
  - para organização e status diferente de `ADOTADO`, os selects "Lar temporário (LT)" e "Vinculado
    a" (LTs da ONG + "Ainda não registrado");
  - aviso "O vínculo com <tutor> será removido ao salvar";
  - os campos de LT são omitidos em `ADOTADO` e para acolhedor, e `larTemporarioId` vai `null` sempre
    que a situação não é `EM_LT` (correção U1 da análise).
- `components/app/AnimalIndicators.tsx`: badges "Em tratamento", "Procurando LT", "Em LT · <tutor>"
  e "Em LT · sem registro", com pares de token `*-muted`/`*-muted-foreground` e texto sempre visível.
- "Meus animais" (`_authenticated.dashboard.animais.index.tsx`):
  - `validateSearch` com `status`, `lt` e `tratamento`; valor inválido na URL vira "sem filtro";
  - o filtro de LT aparece só para ONG, e o checkbox "Só em tratamento" para todos;
  - badges em cada linha.
- Detalhe do animal: `StatusBadge` + `AnimalIndicators` no cabeçalho.
- Painel: cards "Em tratamento", "Procurando LT" e "Em LT sem registro". Os dois de LT aparecem só
  quando vêm no JSON, ou seja, só para ONG.
- Aba "Lares temporários":
  - menu só para ONG;
  - rotas `lares-temporarios.tsx`, `.index.tsx` e `.$larId.tsx`;
  - componente `LarTemporarioForm.tsx`, usado no cadastro e na edição;
  - busca por nome no cliente, sem acento;
  - diálogos de cadastro (com a autorização obrigatória), edição, vincular (só candidatos `EM_LT`
    sem vínculo), desvincular e excluir (lista os animais que ficam "Em LT · sem registro");
  - acolhedor vê uma explicação, sem redirect.
- Saúde:
  - aba "Tratamentos" no `HealthPanel`, com `TratamentoForm` (próxima dose + dica do RF-008)
    validado pelo `registroSaudeSchema` do cliente;
  - no `CompletionForm` da agenda, "Próxima dose (opcional)" para `MEDICAMENTO_TRATAMENTO`;
  - as duas telas invalidam lista, detalhe e painel, para o badge refletir a mudança.
- `routeTree.gen.ts`: regenerado e commitado. O diff tem só as 79 linhas adicionadas das rotas novas,
  nenhuma removida.

**Validação (2026-10-14):**
- build do frontend OK;
- `tsc` do frontend OK;
- o backend não mudou nesta fase (`npm test` da Fase 2 vale).

**A interface ainda não foi vista rodando.** A homologação visual e funcional (H1–H13) é da Fase 4.

### Fase 4 — privacidade e seed (commit `18f9297`; ensaio e homologação pendentes)

- `__tests__/queries/lt-privacy.test.ts`, com 20 casos em duas camadas:
  - **estática:** os 8 arquivos de query pública ou de adotante não citam `situacaoLT`,
    `larTemporario`, `larTemporarioId` nem `emTratamento`, não usam `include:` e não selecionam
    `animal: true`;
  - **execução:** detalhe público, favoritos, solicitações e painel do adotante enviam ao Prisma só
    `select` sem esses campos.

  O vermelho foi demonstrado trocando o `select` de `public-animal.ts` por `include`: 2 casos
  falharam. Depois o arquivo foi revertido com `git checkout`.
- `prisma/seed.ts`:
  - `larTemporario.deleteMany()` no `clearTestData`;
  - 2 LTs fictícios da `organizacao.teste`, achada pelo e-mail;
  - `situacaoLT` por `i % 3` nos animais de ONG; nos `EM_LT` da `organizacao.teste` (i = 2, 17, 32,
    35), o vínculo roda LT1 → LT2 → sem registro → LT1;
  - a Seninha (gata, `DISPONIVEL`, `PROCURANDO`, registro de antibiótico de hoje e cuidado
    `PENDENTE` daqui a 2 dias, no mesmo formato que a interface gera).

**Validação (2026-10-14):**
- `tsc` OK no backend (o seed entra na checagem) e no frontend;
- `npm test`: **439/440**. A falha é a mesma de sempre, o seed test sem `DATABASE_URL` no processo.

**Seed executado (T084/T085):** o Pedro criou o branch Neon `seed-009` (schema only) e rodou
`migrate reset --force` nele. Os servidores de homologação rodaram contra esse branch.

### Homologação H1–H13 (T089–T091, 2026-10-14 a 2026-10-17, no `seed-009`)

Roteiro do `quickstart.md` §3, no navegador embutido, com as contas do seed. Escritas só pela
interface; leituras de conferência por `fetch` GET no navegador.

| H | Resultado | Evidência |
|---|---|---|
| H1 | ✅ | Status sem "Resgatado"; a ajuda muda por status; o Cacau salvo como Em cuidados saiu da vitrine (37 → 36). |
| H2 | ✅ | Telefone inválido e falta de autorização bloqueados com as mensagens da 007; LT "Ana Paula Ferreira" criado. Telefone aparecia cru no detalhe: corrigido em `b809180`. |
| H3 | ✅ após correção | **Datas de saúde gravavam um dia antes** (defeito anterior à 009, o mesmo que a spec 010 corrigiu na `main`). Corrigido em `a2c7553` e substituído pelo `date.ts` da 010 no merge `ca1dd32`. Thor ficou "Em tratamento · Procurando LT". |
| H4 | ✅ após correção | **O detalhe público vazava `MEDICAMENTO_TRATAMENTO` no resumo de saúde.** Corrigido em `3602799`, com caso novo em `lt-privacy.test.ts` (visto vermelho). Vitrine, perfil da ONG, favoritos, solicitações, painel do adotante, Feels e chat sem dados de LT ou tratamento. |
| H5 | ✅ após correção | **`?tratamento=1` era descartado da URL**: o router converte para número e o schema só aceitava string. Corrigido em `79d5fc7`; os 4 cards do painel filtram. |
| H6 | ✅ | Luna marcada "Em LT · sem registro"; o vínculo pela aba listou só Luna e Toby; Toby vinculado ao João pelo formulário. |
| H7 | ✅ | `EM_LT` vinculado → Procurando LT e → Não precisa: aviso exibido, `PATCH` 200, vínculo zerado. |
| H8 | ✅ | LT "Maria Aparecida Souza" excluído; o diálogo listou Bela e Gaia, que ficaram `EM_LT` sem vínculo. |
| H9 | ✅ | Seninha: dose concluída com próxima continua em tratamento; concluída sem próxima, sai. Revalidado depois do merge: tratamento da Cacau com próxima dose 19/10 aparece no filtro "Só em tratamento" e na agenda. |
| H10 | ✅ | Thor (`EM_LT`) aprovado → `EM_PROCESSO_ADOCAO` mantendo o LT → concluído → `ADOTADO`/`NAO_SE_APLICA`/sem vínculo. Otto `ADOTADO` pelo select manual: campos de LT somem, aviso, reset. |
| H11 | ✅ | Acolhedor: sem menu e sem campos de LT; a URL da aba explica; `?lt=EM_LT` → 400; `/api/lares-temporarios` → 403. |
| H12 | ✅ após correção | `organizacao.resende`: lista de LT vazia; `GET` dos LTs da outra ONG → 404; vinculáveis só dela; nenhum dado vazou. **A tela do LT alheio ficava ~10 s em "Carregando"** (4 `GET` 404 pelos retries padrão do React Query) e terminava em alerta de erro. Corrigido em `b809180`: "Lar temporário não encontrado" na hora, 1 chamada. |
| H13 | ✅ após correção | Teclado: ordem de Tab lógica e foco visível em todos os focáveis da lista e do detalhe; diálogos prendem o foco e fecham com Esc; checkbox de autorização alterna com Espaço; selects do `AnimalForm` com rótulo, operáveis por setas, devolvendo o foco. **Ao fechar Novo LT, Editar e Vincular, o foco caía no `body`**: corrigido em `b809180` (`DialogTrigger`). Zoom 200% (viewport CSS 640×400): sem rolagem horizontal em lista e detalhe de LT, Meus animais (com e sem filtro), cadastro de animal e painel. Contraste AA medido nos dois temas, em 7 telas: todos os textos da 009 ≥ 4,5:1 (ver observações). |

**Observações que não contam como falha:**
- O diálogo de excluir LT diz "Os animais Bela, Gaia continuarão marcado(s)": a concordância no plural
  ficou deselegante.
- O "0 disponíveis" da home aparece por um instante: a API devolve o número certo, e parece ser a
  animação do contador.
- O primeiro carregamento de "Meus animais" ficou no esqueleto uma vez e não se repetiu (compilação
  inicial do `vite dev`).
- A descrição da Seninha no seed menciona "antibiótico": é texto livre da ONG, fora do controle do
  sistema.
- **Contraste anterior à 009:** o token `--destructive` no tema escuro dá 3,4:1 sobre o fundo. Afeta o
  asterisco de campo obrigatório (`aria-hidden`) e botões de texto vermelho como "Cancelar" na Central
  de Saúde. Ambos já existiam na `main`; ficou fora do escopo.
- Rota autenticada aberta sem sessão fica em "Carregando…" em vez de levar ao login. É anterior à
  009 e combina com o defeito F3 da ROUTES-01 (§10 do `CLAUDE.md`).

**Validação final (2026-10-17, depois do merge `ca1dd32`):**
- `npm test`: **449/450**. A falha é a de sempre (`organization-search-seed`, sem `DATABASE_URL`);
- `tsc` OK no backend e no frontend;
- build do frontend OK, com as dependências do lockfile pós-merge (`@tanstack/react-start@1.169.1`); `routeTree.gen.ts` inalterado.

### Integração com a `main` (merge `ca1dd32`)

A branch saiu de `95f54d1`, antes da spec 010. A 010 corrigiu na `main` o mesmo defeito de fuso
achado no H3, com `frontend/src/lib/date.ts`. Os conflitos em `HealthPanel.tsx`,
`_authenticated.dashboard.saude.index.tsx` e `specs/README.md` foram resolvidos em favor do
`date.ts`. O `data-local.ts` da homologação foi removido, e o código novo da 009 (formulário de
tratamento, próxima dose da agenda, subtítulo do tratamento) passou a usar `dataInputParaIso` e
`formatarData`. A `main` não trouxe migration nem mudança de schema.

## 3. Decisões que não se reabrem

- As migrations foram geradas contra `HEAD:prisma/schema.prisma`, **não** contra `main:`. A `main`
  local deste repositório (`58a8856`) está atrás da base da branch (`95f54d1`), e um diff contra ela
  sairia errado. Quem regerar migration nesta base deve conferir `git rev-parse main` antes.
- Nos testes, as fixtures `RESGATADO` que testavam uma **transição** viraram outro status de origem
  (`DISPONIVEL → EM_CUIDADOS` e `EM_PROCESSO_ADOCAO → EM_CUIDADOS`), para não virar transição nula. No
  `owner-animals.test.ts`, a troca para `EM_CUIDADOS` garante que o 400 continue vindo do
  `organizacaoId` recusado, e não de um status inválido.
- `createAnimal` passa a gravar `situacaoLT`/`larTemporarioId` resolvidos, iguais ao default do
  banco quando ausentes. Os dois testes que comparavam o `data` exato do create foram atualizados.
- O teste de allowlist do DTO de gestão (`owner-animals.test.ts`) ganhou os 3 campos novos. A lista
  de campos proibidos (`telefone`, `endereco`, …) ficou intacta e passa a provar que o telefone e o
  endereço do **tutor** não saem no DTO do animal: só `id` e `nomeTutor`.
- `lib/actions/lares-temporarios.ts` **não** é `"use server"`. É chamado só pelas rotas, que já
  autenticam e validam; sem a diretiva, as funções não viram Server Actions chamáveis do navegador.
- O filtro `tratamento` entra em `AND: [inTreatmentWhere]`, para não colidir com o filtro `status`
  da mesma consulta (`inTreatmentWhere` também restringe `status`).
- **Divergências do `tasks.md` na Fase 3, resolvidas pelo código real:**
  - **T052:** os campos novos do animal gerenciado ficaram em `lib/data/animais.ts`
    (`OwnedAnimalSummary`), onde o DTO de gestão já vivia, e não em `domain/types.ts`. Os tipos de LT
    ficaram em `lib/data/lares-temporarios.ts`.
  - **T054:** o schema de cliente do LT virou `larTemporarioFormSchema(mode)`, com `autorizacaoTutor`
    booleano e exigido só no cadastro. Um `z.literal(true)` não aceita o checkbox desmarcado como
    estado inicial do formulário. O contrato HTTP continua enviando `autorizacaoTutor: true`.
  - **T069:** a lista de LT **não** usa `page-canvas`. Nenhuma página do painel usa, porque o fundo é
    do layout, e repetir dentro dele cria o "fundo por seção" proibido no §8 do `CLAUDE.md`.
  - **T073:** `lib/data/cuidados.ts` já aceitava `dataProxima` em `MEDICAMENTO_TRATAMENTO`; só o
    `saude.ts` mudou.

## 4. O que a spec previa e não foi entregue

Pendente, todas tarefas do Pedro, porque mexem no Neon ou na produção:
- **T087/T088:** ensaio da migration no `validacao-009` (cópia da produção) e teste rápido do painel
  (`quickstart.md` §2 e §3.1);
- **T092:** apagar os branches `seed-009` e `validacao-009`;
- **T097/T098:** backup `pre-009`, `migrate deploy` na produção, verificador, merge do PR e smoke;
- **T099:** registrar PR, hash do merge e data da virada aqui;
- **T100:** DER, diagrama de classes, casos de uso e doc v21 do TCC;
- **T101:** apagar `pre-009` e `dev-009` 7 dias depois da virada.

## 5. Armadilhas descobertas

- **`organization-search-seed.test.ts` usa um `PrismaClient` real**, não o mock. O `vitest.config.ts`
  não carrega `.env`, então o teste só acha `DATABASE_URL` se a variável estiver exportada **no
  terminal**. Nesse caso ele lê o banco para onde ela aponta, inclusive a produção. Nesta worktree, com
  `.env` mas sem a variável no terminal, ele falha com "Environment variable not found" tanto antes
  quanto depois da 009. Não é regressão.
- **`prisma validate` exige `DATABASE_URL` definida**, mesmo sem conectar.
- **Rede lenta no `npm ci`:** cada consulta ao registro levou de 11 a 13 minutos para revalidar o
  cache. A raiz foi copiada localmente do checkout principal (lockfile idêntico), e o frontend
  instalado com `--prefer-offline`. As duas árvores foram conferidas com `npm ls`.
- **PowerShell 5.1 e `git commit -m` com aspas duplas** dentro de here-string quebram a mensagem em
  vários argumentos. Use `git commit -F <arquivo>`.
- **O router do TanStack converte números na search string.** `?tratamento=1` chega ao
  `validateSearch` como o número `1`, não como `"1"`. Um `z.literal("1")` descarta o filtro em
  silêncio, e o card que deveria filtrar a lista abre a lista inteira.
- **Diálogo Radix aberto por estado não devolve o foco.** Com `<Dialog open={...}>` e um botão comum
  com `onClick`, o foco vai para o `body` ao fechar. É preciso `DialogTrigger asChild` em volta do
  botão. O `ConfirmDestructiveAction` já fazia isso.
- **404 lançado como erro vira 4 chamadas.** O `QueryClient` usa os padrões (3 retries com backoff).
  Recurso que pode não existir, ou que é de outra ONG, deve devolver `null` no 404, como
  `fetchPublicAnimal` e `fetchLarTemporario`. Assim a tela cai no estado vazio na hora.
- **Branch longa atrás da `main`.** A 009 nasceu antes da 010 e reencontrou o defeito de fuso que a
  010 já tinha corrigido. Antes de homologar uma branch longa, integre a `main`.
- **Screenshot logo depois de navegar engana.** Com `defaultViewTransition`, o primeiro quadro pode
  mostrar texto quase invisível. Para medir contraste, espere as animações (`document.getAnimations()`)
  e meça a página real: em iframe oculto as animações de entrada não terminam e o texto mede 1:1.

## 6. Onde o código vive

Ver "O que foi entregue" acima.

## 7. Para quem vier depois

- A virada segue a ordem do `quickstart.md` §4: backup, `migrate deploy` e verificador **antes** do
  merge. Com deploy automático a partir da `main`, um merge antes da migration põe no ar um código
  que lê colunas que ainda não existem.
- Os três caminhos até `ADOTADO` (`completeAdoption`, `updateAnimal`, `updateAnimalStatus`) precisam
  zerar o LT. Quem criar um quarto caminho deve usar `FOSTER_RESET_ON_ADOPTION`.
- Dado de LT ou de tratamento em query pública ou de adotante quebra o `lt-privacy.test.ts`. Se ele
  falhar, não afrouxe o teste: o vazamento é real.
