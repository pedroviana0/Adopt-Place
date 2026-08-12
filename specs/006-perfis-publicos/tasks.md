# Tasks: Perfis públicos e busca por nome

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/` e `quickstart.md` em
`specs/006-perfis-publicos/`.

**Organization**: as fases preservam exatamente as Ondas 0–7 aprovadas no `HANDOFF.md`. Uma onda só
começa depois do checkpoint, commit verificável e registro factual da anterior.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: pode ser executada em paralelo apenas porque não depende de tarefa incompleta e não toca
  o mesmo arquivo.
- **[US1]…[US6]**: história principal atendida; a matriz de rastreabilidade registra FRs e histórias
  adicionais quando a tarefa é compartilhada.
- **[TEST-FIRST]**: criar o teste, executá-lo contra implementação ausente/ingênua, registrar que
  ficou vermelho e somente então iniciar a implementação correspondente.

## Regras de portão aplicáveis a todas as ondas

Em cada checkpoint executar, na raiz:

```powershell
npx tsc --noEmit
npm test
```

E em `frontend/`:

```powershell
npx tsc --noEmit
npm run build
```

Se `frontend/src/routeTree.gen.ts` mudar sem rota nova na onda, descartar somente essa alteração
gerada. Nas Ondas 1, 4, 5 e 6, que criam rotas, revisar e versionar a atualização gerada. Não rodar
build com servidor dev concorrente.

---

## Phase 1 — Onda 0: fundação de dados e migration

**Goal**: preparar campos persistidos, normalização única e backfill seguro que bloqueiam US1, US3,
US4 e US6.

**Independent Test**: uma organização existente e uma recém-cadastrada possuem
`razaoSocialNormalizada`; renomear atualiza a coluna; descrição aceita `null`/500 e rejeita 501;
schema/migration passam sem reset ou perda de dados.

- [X] T001 [P] [TEST-FIRST] Criar testes vermelhos para `normalizarNomeMunicipio()` com acento, caixa, espaços repetidos e razão social em `__tests__/lib/municipios.test.ts` (FR-012, CR-007).
- [X] T002 [P] [TEST-FIRST] Criar testes vermelhos para cadastro de organização gravar `razaoSocialNormalizada` pelo helper existente em `__tests__/actions/auth-register.test.ts` (US3, FR-012, NFR-002).
- [X] T003 [TEST-FIRST] Criar testes vermelhos para PATCH de organização sincronizar `razaoSocial`/`razaoSocialNormalizada`, aceitar descrição vazia como `null`, limitar 500 e nunca aceitar normalizado do cliente em `__tests__/api/profile-screening.test.ts` (US4, FR-006, CR-005).
- [X] T004 Atualizar `prisma/schema.prisma` com `Organizacao.descricao`, `Organizacao.fotoUrl`, `Organizacao.razaoSocialNormalizada`, índice `idx_organizacao_razao_social_normalizada`, `AcolhedorIndependente.descricao` e `AcolhedorIndependente.fotoUrl` (FR-006, FR-012, FR-022, CR-001).
- [X] T005 Gerar e revisar `prisma/migrations/<timestamp>_perfis_publicos/migration.sql` para adicionar campos nullable, fazer backfill com expressão PostgreSQL explícita equivalente ao helper (`translate`, `lower`, compressão de espaços e trim), tornar `razaoSocialNormalizada` obrigatória e criar o índice; adicionar verificação read-only de todas as linhas contra `normalizarNomeMunicipio()` em `scripts/verify-razao-social-normalizada.ts`, sem nova função normalizadora de aplicação, drop/reset ou edição de migration aplicada (FR-012, CR-001, CR-002).
- [X] T006 Reutilizar exclusivamente `normalizarNomeMunicipio()` de `lib/municipios.ts` na criação de organização em `lib/actions/auth-register.ts`, sem criar outro normalizador (US3, FR-012, NFR-002).
- [X] T007 Ampliar schemas Zod de organização/acolhedor com descrição opcional/nullable de até 500 caracteres e rejeição de campos derivados em `lib/schemas/perfil.ts` (US4, FR-006, CR-005).
- [X] T008 Atualizar `app/api/perfil/route.ts` para selecionar `descricao`/`fotoUrl` no perfil próprio e sincronizar a coluna normalizada na mesma escrita que altera `razaoSocial` (US4, FR-006, FR-012).
- [X] T009 Executar o portão completo da Onda 0, `npm run prisma:validate` e a verificação read-only de `scripts/verify-razao-social-normalizada.ts`; exigir zero divergências e confirmar que `frontend/src/routeTree.gen.ts` não permanece alterado em `prisma/schema.prisma`, `prisma/migrations/<timestamp>_perfis_publicos/migration.sql`, `lib/municipios.ts`, `lib/actions/auth-register.ts`, `lib/schemas/perfil.ts` e `app/api/perfil/route.ts`.
- [X] T010 Criar commit verificável da Onda 0 contendo schema, migration, normalização, verificador, schemas e testes em `prisma/`, `scripts/verify-razao-social-normalizada.ts`, `lib/`, `app/api/perfil/route.ts` e `__tests__/` após o portão verde.
- [X] T011 Após existir o commit da Onda 0, registrar hash, comandos, resultados e decisões factuais na linha da Onda 0 em `specs/006-perfis-publicos/ENTREGA.md` e criar commit documental subsequente desse registro.

**Checkpoint**: a fundação de dados está versionada e nenhuma onda seguinte inicia sem T011.

---

## Phase 2 — Onda 1: perfil público de organização e catálogo (US1, P1)

**Goal**: disponibilizar perfil institucional público com endereço e catálogo paginado/filtrável.

**Independent Test**: sem sessão, abrir organização ativa e ver identidade/endereço/catálogo apenas
dela; ausente e desativada produzem o mesmo 404; filtros/paginação funcionam; resposta não vaza dado
proibido.

- [X] T012 [P] [US1] [TEST-FIRST] Criar testes vermelhos do contrato `PROFILE-ORG-01`, 404 indistinguível e allowlist sem CPF/CNPJ/e-mail/telefone/coordenadas em `__tests__/api/public-profiles.test.ts` (FR-002, FR-005, FR-020, CR-007).
- [X] T013 [P] [US1] [TEST-FIRST] Criar testes vermelhos de query para status `DISPONIVEL`, `organizacaoId`, filtros espécie/raça/porte/sexo, raça condicional e paginação 30 em `__tests__/queries/public-profile-catalog.test.ts` (FR-008–FR-011).
- [X] T014 [US1] Definir validação Zod compartilhada de CUID, filtros e página em `lib/schemas/public-profiles.ts`, reutilizando enums e sem aceitar identidade do responsável no query string (FR-009, CR-005).
- [X] T015 [US1] Implementar consulta estreita de organização ativa e catálogo owner-scoped em `lib/queries/public-profiles.ts`, reutilizando a ordenação/paginação de `lib/queries/animal-showcase.ts` sem serializar model Prisma (FR-002, FR-005, FR-008–FR-011, FR-020).
- [X] T016 [US1] Implementar `GET /api/perfis/organizacao/[id]` conforme `PROFILE-ORG-01` em `app/api/perfis/organizacao/[id]/route.ts`, com 400 seguro e mesmo 404 para ausente/desativada (FR-002, FR-005).
- [X] T017 [US1] Criar tipos e cliente HTTP do perfil/catálogo em `frontend/src/lib/data/perfis.ts`, mantendo chamadas relativas `/api/*` e DTOs estreitos (CR-004).
- [X] T018 [US1] Criar schemas Zod cliente para filtros/página em `frontend/src/lib/schemas/public-profiles.ts` e consumi-los no catálogo reutilizável com filtros reversíveis, raça condicional, paginação e estados vazio/loading/erro em `frontend/src/components/app/ProfileCatalog.tsx` (FR-008–FR-011, CR-005, Constituição V).
- [X] T019 [US1] Criar rota pública responsiva em `frontend/src/routes/organizacoes.$organizacaoId.tsx` com `page-canvas`, endereço institucional, descrição/imagem com fallback e links aos animais (FR-002, FR-007, NFR-001).
- [X] T020 [US1] Executar o portão completo da Onda 1; revisar e versionar a nova rota em `frontend/src/routeTree.gen.ts`; confirmar testes vermelhos de T012/T013 agora verdes.
- [X] T021 [US1] Criar commit verificável da Onda 1 contendo `lib/schemas/public-profiles.ts`, `lib/queries/public-profiles.ts`, `app/api/perfis/organizacao/[id]/route.ts`, testes e arquivos frontend da organização.
- [X] T022 [US1] Após existir o commit da Onda 1, registrar hash, contrato entregue, portões e evidências na linha da Onda 1 em `specs/006-perfis-publicos/ENTREGA.md` e criar commit documental subsequente desse registro.

**Checkpoint**: US1 funciona anonimamente e isoladamente antes da navegação dos anúncios.

---

## Phase 3 — Onda 2: navegação pelo responsável nos anúncios (US2, P1)

**Goal**: tornar o responsável navegável em vitrine, detalhe, favoritos e Feels.

**Independent Test**: em cada um dos quatro fluxos, o DTO contém ID/tipo do perfil e o clique abre
a organização/acolhedor correto em um acionamento, sem ampliar dados privados.

- [X] T023 [US2] [TEST-FIRST] Ampliar testes de vitrine e detalhe para exigir `responsavelId`/`responsavelTipo` e falhar com qualquer CPF/CNPJ/e-mail/telefone/endereço/coordenada em `__tests__/api/public-animais.test.ts` (FR-020, CR-007).
- [X] T024 [US2] [TEST-FIRST] Ampliar a suíte existente de favoritos para exigir referência navegável e identificação segura de acolhedor em `__tests__/api/adopter-journey.test.ts` (FR-001, FR-003, FR-020).
- [X] T025 [US2] [TEST-FIRST] Ampliar a suíte de query existente em `__tests__/queries/feels.test.ts` e criar o contrato HTTP de Feels em `__tests__/api/feels.test.ts` para exigir referência navegável sem nome completo/endereço de acolhedor (FR-003, FR-020).
- [X] T026 [US2] Incluir IDs de perfil nos selects e DTOs da vitrine em `lib/queries/animal-showcase.ts` e `app/api/animais/route.ts`, mantendo `Usuario.id` fora da resposta (FR-001, FR-020).
- [X] T027 [US2] Incluir IDs/tipos do responsável no detalhe e resumos relacionados em `lib/queries/public-animal.ts` e `app/api/animais/[id]/route.ts` (FR-001, FR-020).
- [X] T028 [US2] Incluir IDs/tipos do responsável e identificação pública do acolhedor em `lib/queries/favorites.ts` e `lib/queries/feels.ts` (FR-001, FR-003, FR-020).
- [X] T029 [US2] Atualizar tipos dos quatro contratos em `frontend/src/lib/data/animais.ts`, `frontend/src/lib/data/favoritos.ts` e `frontend/src/lib/data/feels.ts` (FR-001, CR-004).
- [X] T030 [US2] Alterar links do responsável em `frontend/src/components/app/PublicAnimalCard.tsx`, `frontend/src/components/app/AnimalSwipeCard.tsx` e `frontend/src/routes/animais.$animalId.tsx` para `/organizacoes/$organizacaoId` ou `/acolhedores/$acolhedorId` conforme tipo (US2, FR-001).
- [X] T031 [US2] Executar o portão completo da Onda 2; confirmar que `frontend/src/routeTree.gen.ts` não permanece alterado e que os quatro contratos passam nas suítes de T023–T025.
- [X] T032 [US2] Criar commit verificável da Onda 2 contendo os quatro DTOs ampliados, tipos frontend, links e testes em `lib/`, `app/api/`, `frontend/src/` e `__tests__/`.
- [X] T033 [US2] Após existir o commit da Onda 2, registrar hash, quatro contratos e portões na linha da Onda 2 em `specs/006-perfis-publicos/ENTREGA.md` e criar commit documental subsequente desse registro.

**Checkpoint**: US2 é demonstrável a partir de cada anúncio sem depender da busca.

---

## Phase 4 — Onda 3: manutenção do próprio perfil (US4, P1)

**Goal**: organização e acolhedor mantêm descrição e imagem próprias com autorização server-side.

**Independent Test**: salvar/apagar descrição reflete no perfil público; upload de imagem válido
atualiza somente a própria conta; arquivo/tipo/tamanho/papel inválido é recusado.

- [X] T034 [P] [US4] [TEST-FIRST] Completar testes vermelhos de PATCH para descrição ≤500, 501, `null`, whitespace e tentativa de editar campos derivados/alheios em `__tests__/api/profile-screening.test.ts` (FR-006, CR-003, CR-005).
- [X] T035 [P] [US4] [TEST-FIRST] Criar testes vermelhos de autorização Uploadthing para anônimo, adotante, inativo, tipo/tamanho/quantidade inválidos e persistência somente no perfil da sessão em `__tests__/actions/profile-image-upload.test.ts` (FR-006, FR-022).
- [X] T036 [US4] Implementar autorização/persistência `profileImage` sem aceitar profile ID no input, com rechecagem no completion, em `lib/upload-router.ts` (FR-006, FR-022, CR-003).
- [X] T037 [US4] Garantir que `app/api/perfil/route.ts` devolva e atualize `descricao`/`fotoUrl` apenas para organização/acolhedor autenticado e mantenha `razaoSocialNormalizada` sincronizada (FR-006, FR-012).
- [X] T038 [US4] Criar adaptador frontend de upload de perfil em `frontend/src/lib/data/profile-image-upload.ts`, reportando sucesso somente após resposta persistida (FR-022).
- [X] T039 [US4] Atualizar cliente/tipos próprios do perfil para descrição e imagem em `frontend/src/lib/data/usuarios.ts` (FR-006, CR-004).
- [X] T040 [US4] Ampliar os schemas Zod cliente já usados com `zodResolver` para descrição ≤500 e arquivo de imagem/tamanho em `frontend/src/routes/_authenticated.dashboard.perfil.tsx`, adicionando campos, fallback e estados de upload (FR-006, FR-007, FR-022, CR-005, Constituição V).
- [X] T041 [US4] Executar o portão completo da Onda 3; confirmar que `frontend/src/routeTree.gen.ts` não permanece alterado e que T034/T035 passaram após a implementação.
- [X] T042 [US4] Criar commit verificável da Onda 3 contendo PATCH, upload router, adaptadores/UI e testes em `app/api/perfil/route.ts`, `lib/upload-router.ts`, `frontend/src/` e `__tests__/`.
- [X] T043 [US4] Homologar edição própria sem seed em organização e acolhedor e registrar evidência transitória conforme `specs/006-perfis-publicos/quickstart.md` sem alterar dados de produção.
- [X] T044 [US4] Após existir o commit da Onda 3, registrar hash, limites Uploadthing, portões e evidência na linha da Onda 3 em `specs/006-perfis-publicos/ENTREGA.md` e criar commit documental subsequente desse registro.

**Checkpoint**: US4 entrega conteúdo real para os perfis sem permitir edição cruzada.

---

## Phase 5 — Onda 4: triagem e endereço restritos (US5, P1)

**Goal**: expor duas projeções do adotante, autorizando dados sensíveis antes de selecioná-los.

**Independent Test**: visitante/outro adotante/responsável sem vínculo recebem apenas projeção
pública; próprio adotante, ADMIN e responsável com solicitação em qualquer status recebem triagem e
endereço, nunca telefone.

- [X] T045 [US5] [TEST-FIRST] Criar suíte vermelha que prova que visitante, outro adotante, responsável sem vínculo e responsável de outra conta não executam query sensível nem recebem triagem/endereço em `__tests__/api/adopter-profile-access.test.ts` (FR-016, FR-017, FR-020, CR-007).
- [X] T046 [US5] [TEST-FIRST] Na mesma suíte `__tests__/api/adopter-profile-access.test.ts`, cobrir autorização do próprio adotante, ADMIN e responsável com solicitações `EM_ANALISE`, `APROVADA`, `RECUSADA` e `CONCLUIDA`, fazendo falhar se houver filtro de status (FR-016, FR-016a, FR-018, CR-007).
- [X] T047 [US5] [TEST-FIRST] Adicionar varredura recursiva vermelha das duas projeções para proibir CPF/CNPJ/e-mail/telefone/coordenadas e endereço fora de `enderecoAnalise` restrito em `__tests__/api/adopter-profile-access.test.ts` (FR-020, CR-007).
- [X] T048 [US5] Definir CUID e tipos discriminados `PUBLIC`/`RESTRICTED` no schema/DTO em `lib/schemas/public-profiles.ts`, sem aceitar papel ou vínculo do navegador (FR-004, FR-016, CR-005).
- [X] T049 [US5] Implementar resolução de sessão ativa e vínculo histórico antes de qualquer seleção sensível em `lib/queries/public-profiles.ts`, usando `SolicitacaoAdocao -> Animal -> responsável` sem predicado de status (FR-016–FR-018, CR-003).
- [X] T050 [US5] Implementar queries separadas pública/restrita em `lib/queries/public-profiles.ts`; excluir telefone de ambas e selecionar endereço/triagem somente após autorização (FR-016a, FR-017, FR-020).
- [X] T051 [US5] Implementar `GET /api/perfis/adotante/[id]` em `app/api/perfis/adotante/[id]/route.ts` com sessão opcional, 400 seguro e 404 indistinguível para ausente/desativado (FR-004, FR-005, FR-016).
- [X] T052 [US5] Adicionar cliente e tipos discriminados do adotante em `frontend/src/lib/data/perfis.ts` (FR-004, FR-016, CR-004).
- [X] T053 [US5] Criar rota `frontend/src/routes/adotantes.$adotanteId.tsx` com `page-canvas`, tokens semânticos e seções transparentes, renderizando projeção pública/restrita, reutilizando `frontend/src/components/app/TriagemReadOnly.tsx` e informando quem pode ver os dados (FR-004, FR-019, NFR-001; decisão herdada da 004).
- [X] T054 [US5] Ligar nomes de adotante existentes no fluxo de análise à nova rota em `frontend/src/routes/_authenticated.dashboard.solicitacoes.$solicitacaoId.tsx`, sem transportar autorização no link (US5, CR-003).
- [X] T055 [US5] Executar o portão completo da Onda 4; revisar/versionar `frontend/src/routeTree.gen.ts`; demonstrar vermelho→verde das proteções T045–T047.
- [X] T056 [US5] Criar commit verificável da Onda 4 contendo projeções, rota API/UI, testes de todos os status e exclusão explícita de telefone.
- [X] T057 [US5] Após existir o commit da Onda 4, registrar hash, matriz de autorização, resultado vermelho→verde e portões na linha da Onda 4 em `specs/006-perfis-publicos/ENTREGA.md` e criar commit documental subsequente desse registro.

**Checkpoint**: o núcleo de CR-007 está verde e a API não seleciona dado sensível sem autorização.

---

## Phase 6 — Onda 5: busca por nome (US3, P2)

**Goal**: buscar somente organizações ativas por trecho normalizado, com limite no banco.

**Independent Test**: termos com/sem acento, caixa e espaços encontram a mesma organização; entrada
curta não consulta a base; no máximo 10 resultados; nenhuma pessoa física/dado privado aparece.

- [ ] T058 [P] [US3] [TEST-FIRST] Criar testes vermelhos da query normalizada, filtro de conta ativa, limite 10 e ordenação em `__tests__/queries/organization-search.test.ts` (FR-012–FR-014, NFR-002, CR-007).
- [ ] T059 [P] [US3] [TEST-FIRST] Criar testes vermelhos do contrato público que falham se adotante/acolhedor ou CPF/CNPJ/e-mail/telefone/endereço/coordenadas aparecerem em `__tests__/api/organization-search.test.ts` (FR-013, FR-020, CR-007).
- [ ] T060 [US3] Definir schema Zod `q` com normalização existente, mínimo 2 após normalizar e máximo seguro de entrada em `lib/schemas/public-profiles.ts` (FR-012, FR-014, CR-005).
- [ ] T061 [US3] Implementar busca Prisma em `lib/queries/public-profiles.ts` usando somente `Organizacao.razaoSocialNormalizada`, `usuario.ativo: true`, `take: 10` e allowlist estrita id/nome/município/UF, sem imagem ou campo adicional (FR-012–FR-014, NFR-002, CR-004).
- [ ] T062 [US3] Implementar `GET /api/busca/organizacoes` em `app/api/busca/organizacoes/route.ts`, retornando 400 antes da query para termo inválido (FR-014).
- [ ] T063 [US3] Ampliar `frontend/src/lib/schemas/public-profiles.ts` com schema Zod cliente do termo mínimo de 2 caracteres e criar cliente/tipos da busca em `frontend/src/lib/data/busca-organizacoes.ts` com chamada relativa e tratamento de vazio/validação (FR-013–FR-015, CR-005, Constituição V).
- [ ] T064 [US3] Criar rota `frontend/src/routes/busca.tsx` com `page-canvas`, tokens semânticos e seções transparentes, busca acessível validada pelo schema cliente, resultados navegáveis, estado vazio e caminho para vitrine (FR-015, NFR-001; decisão herdada da 004).
- [ ] T065 [US3] Integrar entrada de busca pública e navegação em `frontend/src/components/app/Navbar.tsx` sem alterar destinos por papel existentes (US3, FR-012).
- [ ] T066 [US3] Executar o portão completo da Onda 5; revisar/versionar `frontend/src/routeTree.gen.ts`; demonstrar vermelho→verde de FR-013/FR-020 em T058/T059.
- [ ] T067 [US3] Criar commit verificável da Onda 5 contendo query/endpoint, busca frontend/navbar e testes de normalização/privacidade.
- [ ] T068 [US3] Homologar busca com dados existentes e registrar que o teste definitivo com nome acentuado depende da Onda 7 em `specs/006-perfis-publicos/quickstart.md` sem alterar o roteiro aprovado.
- [ ] T069 [US3] Após existir o commit da Onda 5, registrar hash, evidência vermelho→verde, limites e portões na linha da Onda 5 em `specs/006-perfis-publicos/ENTREGA.md` e criar commit documental subsequente desse registro.

**Checkpoint**: US3 funciona no banco e nunca se torna diretório de pessoas físicas.

---

## Phase 7 — Onda 6: perfil do acolhedor (US6, P3)

**Goal**: entregar identidade pública mínima, município e catálogo sem expor residência/pessoa.

**Independent Test**: perfil anônimo mostra “Primeiro I.” e animais disponíveis próprios; resposta
inteira não contém nome completo, endereço, CPF, telefone, e-mail ou coordenadas.

- [ ] T070 [P] [US6] [TEST-FIRST] Criar testes vermelhos de derivação “primeiro nome + inicial do último sobrenome”, conta ativa/404 e catálogo owner-scoped em `__tests__/queries/public-foster-profile.test.ts` (FR-001, FR-003, FR-005, FR-008).
- [ ] T071 [P] [US6] [TEST-FIRST] Criar contrato vermelho com varredura recursiva que falha para nome completo, endereço, CPF, telefone, e-mail e coordenadas em `__tests__/api/public-foster-profile.test.ts` (FR-003, FR-020, CR-007).
- [ ] T072 [US6] Implementar derivação server-side da identificação e query estreita de acolhedor ativo em `lib/queries/public-profiles.ts`, sem selecionar campos proibidos na projeção pública (FR-003, FR-020).
- [ ] T073 [US6] Implementar `GET /api/perfis/acolhedor/[id]` em `app/api/perfis/acolhedor/[id]/route.ts`, reutilizando filtros/paginação do catálogo e 404 indistinguível (FR-001, FR-003, FR-005, FR-008–FR-011).
- [ ] T074 [US6] Ampliar tipos/cliente de perfis para `PROFILE-FOSTER-01` em `frontend/src/lib/data/perfis.ts` (CR-004).
- [ ] T075 [US6] Criar rota pública `frontend/src/routes/acolhedores.$acolhedorId.tsx` com `page-canvas`, identificação mínima, município, descrição/imagem com fallback e catálogo reutilizado (FR-003, FR-007, NFR-001).
- [ ] T076 [US6] Confirmar que links adicionados na Onda 2 resolvem o perfil do acolhedor em `frontend/src/components/app/PublicAnimalCard.tsx`, `frontend/src/components/app/AnimalSwipeCard.tsx` e `frontend/src/routes/animais.$animalId.tsx` sem fallback para nome completo (US2, US6).
- [ ] T077 [US6] Executar o portão completo da Onda 6; revisar/versionar `frontend/src/routeTree.gen.ts`; demonstrar vermelho→verde dos testes de privacidade T070/T071.
- [ ] T078 [US6] Criar commit verificável da Onda 6 contendo query/endpoint/rota, integração de links e testes de privacidade do acolhedor.
- [ ] T079 [US6] Homologar anonimamente perfil com/sem descrição, imagem e animais e registrar evidência conforme `specs/006-perfis-publicos/quickstart.md`.
- [ ] T080 [US6] Após existir o commit da Onda 6, registrar hash, allowlist, portões e evidência na linha da Onda 6 em `specs/006-perfis-publicos/ENTREGA.md` e criar commit documental subsequente desse registro.

**Checkpoint**: US6 fecha o mapa de perfis sem transformar residência em dado público.

---

## Phase 8 — Onda 7: seed com acentos e homologação completa

**Goal**: provar requisitos contra dados autorizados reais, acessibilidade e regressão integrada.

**Independent Test**: seed cria organização acentuada cuja busca sem acento funciona; todos os
fluxos passam nos viewports/zoom alvo e as features 003–005 não regridem.

- [ ] T081 [TEST-FIRST] Adicionar caso de seed/teste que espera encontrar uma organização com razão social acentuada por termo sem acento e fica vermelho se `razaoSocialNormalizada` estiver ausente/incorreta em `__tests__/seed/organization-search-seed.test.ts` (US3, FR-012, SC-005).
- [ ] T082 Atualizar somente dados autorizados em `prisma/seed.ts` com ao menos uma razão social acentuada, descrições e `razaoSocialNormalizada` calculada por `normalizarNomeMunicipio()`, preservando municípios distribuídos e duas fotos por animal disponível (FR-012, NFR-003).
- [ ] T083 Criar `specs/006-perfis-publicos/evidencias/onda-7.md`, executar o seed somente no ambiente autorizado antes das sessões e registrar contagens/organizações de teste nesse arquivo, sem reset/migration em produção.
- [ ] T084 Homologar US1/US6: perfis, catálogos, filtros, paginação, fallbacks e ausência de dados proibidos em 375, 1024 e 1440 px e zoom 200%, registrando resultados e caminhos de capturas em `specs/006-perfis-publicos/evidencias/onda-7.md` conforme `specs/006-perfis-publicos/quickstart.md` (FR-001–FR-011, NFR-001).
- [ ] T085 Homologar US2: navegação de vitrine, detalhe, favoritos e Feels ao responsável correto em um acionamento nos três viewports, registrando evidências em `specs/006-perfis-publicos/evidencias/onda-7.md` (FR-001, SC-008).
- [ ] T086 Homologar US5 com matriz anônimo/outro adotante/sem vínculo/outra conta/próprio/ADMIN e solicitações nos quatro status, inspecionando JSON sem telefone e registrando evidências em `specs/006-perfis-publicos/evidencias/onda-7.md` (FR-016–FR-020, SC-004/SC-004a).
- [ ] T087 Homologar US3 com acento/caixa/espaços, termo curto, limite 10, resultado vazio e exclusão de pessoas físicas em 375, 1024 e 1440 px/200%, registrando evidências em `specs/006-perfis-publicos/evidencias/onda-7.md` (FR-012–FR-015, SC-005/SC-006).
- [ ] T088 Executar regressão das features 003–005, teclado/foco, contraste, ausência de rolagem horizontal e chamadas externas de geocodificação, registrando comandos/resultados em `specs/006-perfis-publicos/evidencias/onda-7.md` e seguindo `specs/006-perfis-publicos/quickstart.md`.
- [ ] T089 Executar o portão completo final da Onda 7; confirmar que `frontend/src/routeTree.gen.ts` contém somente rotas novas legítimas e que `npx tsc --noEmit`, `npm test`, frontend `npx tsc --noEmit` e `npm run build` estão verdes.
- [ ] T090 Criar commit verificável da Onda 7 contendo `prisma/seed.ts`, `__tests__/seed/organization-search-seed.test.ts` e `specs/006-perfis-publicos/evidencias/onda-7.md` após o portão final verde.
- [ ] T091 Somente após existir o commit T090, atualizar a linha da Onda 7, seções de código real, dívidas e status final em `specs/006-perfis-publicos/ENTREGA.md`, citando o hash verificável.
- [ ] T092 Criar commit documental subsequente contendo `specs/006-perfis-publicos/ENTREGA.md` atualizado após a Onda 7.

**Checkpoint**: feature pronta para revisão/PR; deploy continua fora desta lista sem confirmação.

---

## Dependencies & Execution Order

### Wave gates

```text
Onda 0 → Onda 1 → Onda 2 → Onda 3 → Onda 4 → Onda 5 → Onda 6 → Onda 7
```

- Onda 0 bloqueia todas as demais por schema/normalização.
- Onda 1 cria catálogo e perfil de organização reutilizados nas Ondas 2 e 6.
- Onda 2 depende das URLs da Onda 1 e prepara links que a Onda 6 completa.
- Onda 3 depende dos campos da Onda 0 e alimenta os perfis das Ondas 1/6.
- Onda 4 depende apenas da fundação, mas permanece após a Onda 3 por portão aprovado.
- Onda 5 depende da coluna/escritas da Onda 0 e permanece após a Onda 4.
- Onda 6 reutiliza catálogo da Onda 1 e links da Onda 2.
- Onda 7 depende de todas as implementações e é a única que executa seed/homologação completa.

### Tests before implementation

Em cada onda, todas as tarefas `[TEST-FIRST]` precisam estar criadas e comprovadamente vermelhas
antes da primeira tarefa de implementação que elas protegem. O commit da onda só ocorre após o
portão verde. `ENTREGA.md` só recebe o hash depois de ele existir.

## User Story and Requirement Traceability

| Story | Waves/tasks | Main requirements | Independent completion signal |
|---|---|---|---|
| US1 (P1) | Onda 0; T012–T022; T084 | FR-002, FR-005, FR-007–FR-011, FR-020 | organização ativa abre anonimamente com catálogo próprio seguro |
| US2 (P1) | T023–T033; T076; T085 | FR-001, FR-003, FR-020 | quatro contratos levam ao perfil correto em um acionamento |
| US3 (P2) | Onda 0; T058–T069; T081–T083; T087 | FR-012–FR-015, FR-020, NFR-002 | busca sem acento encontra nome acentuado e nunca pessoa física |
| US4 (P1) | Onda 0; T034–T044 | FR-006, FR-007, FR-012, FR-022 | próprio responsável mantém descrição/imagem sem edição cruzada |
| US5 (P1) | T045–T057; T086 | FR-004, FR-016–FR-021 | projeção sensível só para próprio/ADMIN/vínculo histórico |
| US6 (P3) | Onda 0; T070–T080; T084 | FR-001, FR-003, FR-005, FR-007–FR-011, FR-020 | perfil de acolhedor não revela identidade/endereço privados |

## Parallel Opportunities

- T001/T002 podem ser escritos em paralelo; T003 toca outro arquivo, mas aguarda a definição exata
  do PATCH e por isso não recebe `[P]`.
- T012/T013, T034/T035, T058/T059 e T070/T071 são pares de testes em arquivos distintos, sem
  dependência entre si; suas implementações continuam bloqueadas até ambos ficarem vermelhos.
- Não paralelizar tarefas que alteram `lib/queries/public-profiles.ts`, `lib/schemas/public-profiles.ts`,
  `frontend/src/lib/data/perfis.ts`, `frontend/src/routeTree.gen.ts`, `Navbar.tsx` ou `ENTREGA.md`.
- Ondas não são paralelizáveis entre si, mesmo quando arquivos diferem, por decisão explícita de
  portão e rastreabilidade.

## Implementation Strategy

### MVP demonstrável

1. Completar e registrar Onda 0.
2. Completar e registrar Onda 1.
3. Parar e demonstrar US1 anonimamente antes de seguir.

### Incremental delivery

Após o MVP, avançar estritamente Onda 2→7. Cada onda produz um incremento testável, um commit verde
e um registro factual posterior. Nenhum commit direto na `main`; ao final, abrir PR da branch
`006-perfis-publicos` conforme governança.

## Notes

- Não criar outro normalizador; importar `normalizarNomeMunicipio()`.
- Não adicionar SQL cru em aplicação; revisar apenas o SQL da migration Prisma necessária ao backfill.
- Não selecionar triagem/endereço antes da autorização.
- Não devolver telefone no novo endpoint de adotante.
- Não executar seed antes da Onda 7 nem contra produção.
- Não editar `legacy/` nem reformatar CRLF em massa.
- `tasks.md` descreve trabalho futuro; nenhuma tarefa está implementada nesta geração.
