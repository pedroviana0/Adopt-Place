# Feature Specification: Backend Frontend Integration

**Feature Branch**: `003-backend-frontend-integration`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Criar a feature 003-backend-frontend-integration para integrar o frontend oficial do Lovable, localizado em frontend/, ao backend real preservado na raiz do repositório. A primeira entrega deve ser uma auditoria e uma matriz de integração, não a implementação completa do sistema."

## Clarifications

### Session 2026-07-23

- Q: A raiz continuará tendo interface pública ativa durante a integração? → A: A raiz ficará publicada somente como backend/serviço real. Suas telas não serão consideradas parte da interface pública ativa. `frontend/` será a única interface pública oficial. As rotas visuais existentes na raiz deverão ser ignoradas, protegidas ou redirecionadas conforme definido no planejamento, sem manter duas interfaces públicas concorrentes. A raiz continuará responsável por autenticação, contratos HTTP, validações, autorização e acesso ao banco de dados.

- Q: Quando um fluxo da integração pode ser considerado pronto? → A: Um fluxo somente será considerado pronto quando o contrato HTTP estiver documentado, o backend estiver implementado e validado, o frontend consumir dados reais, mocks/dados fictícios/localStorage daquele fluxo tiverem sido removidos, e os critérios de aceite e testes do fluxo passarem. A matriz deve diferenciar claramente os estados: auditado, contrato definido, backend pronto, frontend integrado e fluxo concluído.

- Q: Como o trabalho será dividido entre Arthur/Claude e Pedro/Codex durante a integração? → A: Arthur/Claude ficará responsável por manter e adaptar o frontend oficial em `frontend/`. Pedro/Codex ficará responsável pelo backend da raiz, contratos HTTP, segurança, specs, tasks e validações. A matriz de integração será o ponto de sincronização. Fluxos que exigirem mudanças nos dois lados devem ser separados em duas Issues relacionadas, uma para backend e outra para frontend, com dependências e critérios de aceite claros.

- Q: O que a primeira entrega deve considerar pronto: apenas auditoria/matriz/contratos ou também implementação inicial? → A: A primeira entrega deverá produzir a auditoria, a matriz de integração e o inventário dos contratos HTTP necessários para cada fluxo, sem exigir a implementação desses contratos. A implementação será dividida posteriormente em Issues pequenas, começando pela prova técnica de autenticação e sessão.

- Q: Qual será a forma canônica de publicação e integração entre o frontend oficial e o backend real? → A: `frontend/` será a aplicação pública oficial publicada separadamente, consumindo o backend real da raiz por contratos HTTP autenticados. O backend da raiz será a única camada autorizada a acessar Prisma e PostgreSQL, a autenticação continuará usando NextAuth, e o planejamento deve priorizar mesma origem ou proxy reverso para simplificar cookies, sessão e CORS.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Auditar o encaixe entre frontend e backend (Priority: P1)

Pedro, Arthur e os revisores precisam de uma auditoria clara que compare as telas, fluxos, dados e regras do frontend oficial com as capacidades reais já existentes no backend, antes de qualquer substituição ampla de mocks.

**Why this priority**: A integração envolve dois produtos já existentes no mesmo repositório. Sem uma auditoria inicial, há risco de implementar atalhos, duplicar contratos, perder regras de autorização ou considerar concluídas telas que ainda dependem de mocks.

**Independent Test**: Revisar a entrega de auditoria e confirmar que cada área funcional do frontend oficial possui status de integração, fonte real esperada, lacunas conhecidas, riscos e próximo passo verificável.

**Acceptance Scenarios**:

1. **Given** que o frontend oficial usa dados simulados, **When** a auditoria é produzida, **Then** cada módulo de dados simulado é associado a uma capacidade real existente, lacuna comprovada ou decisão pendente.
2. **Given** que a feature 002 declara Central de Saúde, painel e chat, **When** a auditoria avalia essas áreas, **Then** elas só podem ser classificadas como prontas se os comportamentos da feature 002 forem comprovados no código e nos fluxos visíveis.
3. **Given** que uma tela muda a URL mas não renderiza a experiência esperada, **When** a auditoria percorre as rotas principais, **Then** o problema é registrado com tela afetada, comportamento observado e fluxo que deve ser corrigido.

---

### User Story 2 - Integrar autenticação e perfis reais em fatias verificáveis (Priority: P1)

Usuários precisam entrar, sair e editar seus perfis usando contas reais, papéis reais e estado de conta ativa, sem sessão fictícia, dados em localStorage ou comportamento que ignore autorização.

**Why this priority**: Autenticação, papel, conta ativa e perfil são a base para todas as demais áreas protegidas.

**Independent Test**: Entrar com contas reais de adotante, organização, acolhedor e administrador; confirmar navegação por papel, bloqueio de conta inativa, edição de perfis permitidos e rejeição de campos imutáveis.

**Acceptance Scenarios**:

1. **Given** que um usuário real está autenticado, **When** acessa o frontend oficial, **Then** a interface mostra apenas navegação, ações e dados compatíveis com seu papel e conta ativa.
2. **Given** que uma organização ou acolhedor edita seu perfil, **When** salva dados permitidos, **Then** as alterações persistem e CPF/CNPJ permanecem somente leitura.
3. **Given** que um usuário tenta acessar uma área de outro papel ou uma conta inativa tenta usar área protegida, **When** a ação é solicitada, **Then** o acesso é negado antes de exibir ou alterar dados protegidos.

---

### User Story 3 - Substituir dados simulados por fluxos reais de adoção (Priority: P2)

Visitantes, adotantes, organizações e acolhedores precisam usar vitrine, favoritos, triagem, solicitações, animais, saúde e dashboard com dados persistidos e regras reais, mantendo o frontend oficial como única interface ativa.

**Why this priority**: Esses fluxos compõem o ciclo principal definido pela feature 001 e precisam migrar dos mocks para a fonte real sem quebrar o produto.

**Independent Test**: Executar um fluxo pequeno por vez: buscar animal real, favoritar, concluir triagem, solicitar adoção, aprovar ou recusar, gerir animal próprio, registrar saúde e visualizar dashboard com dados reais.

**Acceptance Scenarios**:

1. **Given** que há animais reais disponíveis, **When** visitante ou adotante usa a vitrine, **Then** filtros, perfil público, fotos, tags e dados públicos vêm da fonte real e não expõem dados sensíveis.
2. **Given** que um adotante concluiu triagem, **When** solicita adoção ou favorita um animal, **Then** a persistência ocorre na fonte real e respeita duplicidade, disponibilidade do animal e papel do usuário.
3. **Given** que organização ou acolhedor gerencia seus próprios animais, saúde e solicitações, **When** executa ações permitidas, **Then** somente dados sob seu ownership são listados ou alterados.

---

### User Story 4 - Validar Saúde, dashboard e chat contra a feature 002 (Priority: P2)

Responsáveis e adotantes precisam que Central de Saúde, painel operacional e chat funcionem conforme a feature 002, com os limites clínicos e de conversa preservados.

**Why this priority**: Essas áreas foram especificadas recentemente e não podem ser consideradas integradas sem auditoria funcional contra a especificação.

**Independent Test**: Auditar e depois validar cada fluxo da feature 002: agenda de saúde, documentos, dashboard operacional, liberação de conversa após aprovação, bloqueio antes da aprovação e modo somente leitura após conclusão.

**Acceptance Scenarios**:

1. **Given** que uma consulta futura é concluída, **When** o histórico clínico é exibido, **Then** a consulta não aparece como fato clínico; somente fatos permitidos podem compor o histórico.
2. **Given** que uma solicitação está em análise ou recusada, **When** algum participante tenta abrir chat, **Then** o chat não fica disponível.
3. **Given** que uma solicitação aprovada possui conversa e depois a adoção é concluída, **When** os participantes abrem a conversa, **Then** o histórico permanece visível e novos envios são bloqueados.

---

### User Story 5 - Desativar interfaces concorrentes sem perder histórico (Priority: P3)

Equipe do projeto precisa que `frontend/` seja a interface ativa, enquanto `legacy/frontend-antigo/` permanece preservado apenas como referência histórica.

**Why this priority**: Manter duas interfaces ativas aumenta ambiguidade, risco de regressão e esforço de validação.

**Independent Test**: Abrir o projeto e confirmar que a experiência ativa direciona para `frontend/`, que o backend real permanece na raiz e que nenhum fluxo depende de `legacy/frontend-antigo/` para funcionamento.

**Acceptance Scenarios**:

1. **Given** que um usuário acessa a aplicação ativa, **When** navega por qualquer fluxo principal, **Then** a interface usada é a de `frontend/`.
2. **Given** que o diretório histórico existe, **When** a integração é validada, **Then** `legacy/frontend-antigo/` permanece preservado, mas não é tratado como interface ativa.

### Edge Cases

- Módulo do frontend sem equivalente real comprovado deve entrar na matriz como lacuna ou decisão pendente, não como requisito implementado.
- A expectativa de foto de perfil para Organização ou Acolhedor Independente deve permanecer como `lacuna/decisão pendente` enquanto `prisma/schema.prisma` não comprovar o campo e produto não decidir o comportamento; ela não pode ser tratada como contrato definido nem justificar migration no banco original.
- Dados de seed ou localStorage não podem ser aceitos como prova de persistência real.
- Rotas que atualizam a URL sem renderizar tela devem ser tratadas como falhas de navegação da integração.
- Usuários inativos não podem visualizar dados protegidos mesmo que uma tela frontend permita navegação local.
- Adotantes não podem acessar gestão de animais, saúde operacional, solicitações de terceiros ou administração.
- Organizações e acolhedores não podem ver animais, solicitações, documentos, mensagens ou métricas de outro responsável.
- Administradores não devem acessar conversas automaticamente sem regra explícita já definida.
- Consulta concluída não pode ser registrada nem exibida como fato do histórico clínico.
- Conversas não podem ser liberadas antes da aprovação da solicitação.
- Conversas arquivadas por adoção concluída devem permanecer somente leitura.
- A integração deve ser quebrada em fluxos pequenos; uma área não pode ser marcada como concluída por aparência visual isolada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST produce an initial integration audit before any area is marked integrated or complete.
- **FR-002**: The first delivery MUST include `integration-matrix.md` covering authentication, profiles, screening, public showcase, favorites, adoption requests, animals, photos, health, dashboard, chat, administration, navigation, and route rendering.
- **FR-003**: Each matrix row MUST identify current frontend behavior, current real backend capability, source-of-truth entity or rule, known gap, risk level, smallest verifiable next flow, required HTTP contract inventory, responsible side, related backend/frontend Issue needs, responsible owner, affected files or areas, execution order, dependencies, acceptance criteria, and one explicit status from: audited, contract defined, backend ready, frontend integrated, or flow complete.
- **FR-004**: System MUST treat `frontend/` as the only official public interface and the only active user-facing application for integration acceptance.
- **FR-005**: System MUST preserve `legacy/frontend-antigo/` as historical reference only and MUST NOT rely on it for active flows.
- **FR-006**: System MUST progressively replace mock data, seed-only behavior, fictitious sessions, and localStorage persistence with real authenticated and persisted data.
- **FR-007**: All persisted user actions MUST be reflected in the real source of truth and remain visible after reload, logout/login, and browser storage clearing.
- **FR-008**: Authentication flows MUST use real accounts, NextAuth-backed authenticated HTTP contracts, real active/inactive status, and real role information for ADOTANTE, ORGANIZACAO, ACOLHEDOR, and ADMIN.
- **FR-009**: Profile editing MUST be available for adopters, organizations, and independent fosters according to their allowed editable fields.
- **FR-010**: Profile editing MUST keep immutable identifiers such as CPF and CNPJ read-only.
- **FR-011**: Public showcase and animal profile flows MUST use real animal, photo, responsible-party, tag, and public health summary data.
- **FR-012**: Public pages MUST NOT expose CPF, CNPJ, phone, e-mail, full address, screening answers, internal health notes, documents, clinic/professional details, private request data, or chat data.
- **FR-013**: Screening flows MUST persist real adopter screening data and preserve the rule that screening is required before adoption requests.
- **FR-014**: Favorites MUST persist for real adopters and MUST NOT be available to visitors, organizations, fosters, or administrators.
- **FR-015**: Adoption request flows MUST persist real requests and preserve availability, duplicate active request, status transition, automatic competing-request refusal, and ownership rules.
- **FR-016**: Animal management MUST operate only on animals owned by the authenticated organization or foster.
- **FR-017**: Health management MUST operate only on animals owned by the authenticated organization or foster.
- **FR-018**: Health history MUST include only completed clinical facts from allowed categories and MUST never register CONSULTA as a clinical history fact.
- **FR-019**: Future appointments may appear as operational agenda items, but completing a CONSULTA MUST NOT create or display a CONSULTA health-history record.
- **FR-020**: Operational dashboard data MUST be calculated from real source data for the authenticated user and MUST NOT aggregate another responsible party's data.
- **FR-021**: Feature 002 health center, dashboard, and chat behavior MUST be audited against the existing specification and code before those areas are considered integrated.
- **FR-022**: Chat MUST become available only for participants of an approved adoption request.
- **FR-023**: Chat MUST remain unavailable for requests in analysis or refused.
- **FR-024**: Chat MUST become read-only after adoption conclusion while preserving message history for authorized participants.
- **FR-025**: Administration flows MUST use real user accounts and preserve activation/deactivation behavior.
- **FR-026**: System MUST preserve authorization by role, active account, ownership, adopter identity, and chat participation across all integrated flows.
- **FR-027**: Navigation MUST render the expected screen for every supported route change in the active frontend.
- **FR-028**: Any route that changes URL without rendering the matching screen MUST be captured in the audit and fixed before that route's flow can be accepted.
- **FR-029**: Integration delivery MUST be organized into small, independently verifiable flows, starting with audit, integration matrix, and HTTP contract inventory rather than contract implementation or full-system implementation.
- **FR-030**: No new endpoint, data model, user capability, or product rule may be added unless it is traced to current code, feature 001, feature 002, the constitution, or the existing integration plan.
- **FR-031**: The backend at the repository root MUST be published only as the real backend/service layer and MUST be the only layer allowed to access Prisma and PostgreSQL; the public frontend MUST consume persisted data only through authenticated HTTP contracts.
- **FR-032**: Planning MUST prefer same-origin publication or a reverse proxy for the separated frontend and backend so cookies, session handling, and cross-origin protections stay simple and auditable.
- **FR-033**: The first implementation issue after the documentation delivery SHOULD be a technical proof of real authentication and session flow between the public frontend and backend.
- **FR-034**: Backend, HTTP contracts, security, specs, tasks, and validation work MUST be owned by Pedro/Codex; active frontend adaptation work in `frontend/` MUST be owned by Arthur/Claude.
- **FR-035**: When a flow requires both backend and frontend changes, the work MUST be split into related backend and frontend Issues with explicit dependencies and acceptance criteria.
- **FR-036**: A flow MUST NOT be marked complete until its HTTP contract is documented, backend is implemented and validated, frontend consumes real data, mocks/fictitious data/localStorage for that flow are removed, and acceptance criteria and tests pass.
- **FR-037**: Existing visual routes in the repository root MUST NOT be treated as active public interface routes; planning MUST decide whether each such route is ignored, protected, or redirected so the product does not keep two competing public interfaces.
- **FR-038**: No implementation task for a flow may start until its matrix row has evidence for the required HTTP contract and the explicit status `contract defined`; a missing contract MUST remain a gap or pending decision rather than an invented endpoint, model, or capability.
- **FR-039**: The possible profile-photo requirement for Organização and AcolhedorIndependente MUST be recorded as `lacuna/decisão pendente` because the current Prisma schema does not prove `fotoUrl` for those profiles; any schema change requires an explicit product decision and homologation validation before migration, and MUST NOT mutate the original database as part of the documentation delivery.
- **FR-040**: The audit, `integration-matrix.md`, and HTTP contract inventory form a mandatory initial documentation gate; all three MUST be completed and verified before any implementation task begins.

### Constitution Requirements *(mandatory)*

- **CR-001**: Requirements MUST NOT introduce abstractions beyond the concrete need to connect the active frontend to existing real product behavior.
- **CR-002**: Data requirements MUST trace each integrated flow to existing source-of-truth entities, fields, relationships, or constraints before implementation planning.
- **CR-003**: Business rules MUST remain trusted backend behavior, including authentication, active-account checks, role permissions, ownership isolation, adoption state transitions, health constraints, and chat participation.
- **CR-004**: Protected data access MUST require an authenticated active user before showing or changing profile, screening, favorites, requests, animal management, health, dashboard, chat, or administration data.
- **CR-005**: User input MUST retain client-facing validation and trusted server-side validation for every integrated form or action.
- **CR-006**: Client state MUST be limited to transient UI state, form fields, filters, tabs, navigation state, upload/sending state, and display refresh state; persisted product data MUST NOT live only in browser storage.
- **CR-007**: New dependency requirements MUST be rejected unless existing project capabilities cannot satisfy the integration behavior.
- **CR-008**: Entity typing requirements MUST derive from the Prisma-backed source of truth or narrow derivatives and MUST avoid untyped entity shapes.
- **CR-009**: Critical paths that enforce authorization, ownership, adoption transitions, health-history constraints, chat release, or chat archiving MUST be covered by automated tests before implementation tasks are accepted.

### Key Entities *(include if feature involves data)*

- **Usuario**: Authenticated account with e-mail, role and active status used to control access across the active frontend.
- **Adotante**: Adoption requester profile, screening owner, favorite owner, request owner, and chat participant after approval.
- **Organizacao**: Responsible-party profile that owns animals and manages requests, health, dashboard data, and approved-adoption chat for its animals.
- **AcolhedorIndependente**: Independent responsible-party profile with the same ownership responsibilities for its own animals.
- **Animal**: Rescued animal displayed publicly and managed privately with lifecycle status, responsible party, photos, health, relationships, favorites, requests, and chat context through requests.
- **FotoAnimal**: Animal photo data, including primary and ordered photos used by the public and management views.
- **RegistroSaude**: Completed health fact for allowed clinical categories only; CONSULTA is not a valid history fact.
- **CuidadoPlanejado**: Operational planned care or consultation item used by the health agenda and dashboard.
- **DocumentoSaude**: Internal animal health document visible only to authorized responsible users.
- **Triagem do Adotante**: Structured adopter answers required before requesting adoption and visible only in authorized contexts.
- **Favorito**: Persisted relationship between an adopter and an animal.
- **SolicitacaoAdocao**: Adoption request with status and decision rules; approval gates chat availability.
- **ConversaAdocao**: Private conversation linked to an approved or completed adoption request.
- **MensagemAdocao**: Immutable MVP text message visible only to authorized conversation participants.
- **ConversaParticipante**: Per-user conversation participation and read-state information.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The first delivery covers 100% of the active frontend data modules and all primary route groups in the audit, integration matrix, and HTTP contract inventory before implementation begins.
- **SC-002**: 100% of matrix rows use one of the required statuses: audited, contract defined, backend ready, frontend integrated, or flow complete, with evidence from current code or specs.
- **SC-003**: After each flow marked complete, persisted changes remain visible after page reload, logout/login, and browser storage clearing in acceptance checks, with mocks and localStorage removed from that flow.
- **SC-004**: 100% of protected flow checks deny unauthorized users before any protected data is displayed or changed.
- **SC-005**: 100% of public-page reviews exclude sensitive personal, internal health, private request, and chat data.
- **SC-006**: During manual homologation, each selected small flow must be completed in under 3 minutes: login/session reload/logout, public showcase filter-to-animal-detail, profile edit, screening-to-adoption-request, responsible-party request decision, animal create-or-edit, health record operation, dashboard review, health-document access, chat after approval/read-only after conclusion, and admin activation/deactivation. The matrix or homologation checklist records flow name, role, start/end timestamps, elapsed time, environment, result, and evidence reference; no automated duration test is required.
- **SC-007**: 100% of supported navigation actions render the expected active frontend screen or are logged as known integration defects.
- **SC-008**: Health, dashboard and chat are not marked complete until every applicable feature 002 acceptance scenario has an audited pass, partial, blocked, or not-yet-integrated status.
- **SC-009**: 100% of consultation completion checks confirm that CONSULTA does not appear as a clinical history fact.
- **SC-010**: 100% of chat availability checks confirm no access before approval and read-only access after completed adoption.

## Assumptions

- The merge of the Lovable frontend into `main` is the baseline for this feature.
- `frontend/` is the only official public interface and will be published separately from the backend, preferably through same-origin routing or a reverse proxy when planned.
- The backend source of truth remains the real application preserved at the repository root; it is responsible for authentication, HTTP contracts, validation, authorization, and database access, and only that backend may access Prisma/PostgreSQL directly.
- Existing feature 001 and feature 002 specifications remain authoritative for product behavior unless a later clarification explicitly changes them.
- The existing `frontend/INTEGRATION.md` contracts describe the current mock boundary and are treated as planning input, not as permission to invent missing backend capabilities.
- The first delivery is the verified documentation gate formed by the audit, `integration-matrix.md`, and HTTP contract inventory; the existence of plan and task documents does not authorize implementation before that gate closes.
- Arthur/Claude owns active frontend adaptation in `frontend/`; Pedro/Codex owns backend, HTTP contracts, security, specs, tasks, and validation.
- Seeds may support demonstration, but seed or localStorage behavior does not count as real persistence for acceptance.
