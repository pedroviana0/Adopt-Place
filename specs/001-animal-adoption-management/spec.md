# Feature Specification: Animal Adoption Management

**Feature Branch**: `001-animal-adoption-management`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: "Sistema web para gestão do ciclo completo de animais resgatados — do acolhimento ao processo de adoção, com vitrine pública, cadastro de animais, histórico de saúde, triagem de adotantes, solicitações de adoção, favoritos, administração de usuários e suporte a organizações protetoras e acolhedores independentes em Volta Redonda/RJ."

## Clarifications

### Session 2026-05-25

- Q: Quais são os estados canônicos do ciclo de vida do animal e da solicitação de adoção? → A: Animal: RESGATADO, EM_CUIDADOS, DISPONIVEL, EM_PROCESSO_ADOCAO, ADOTADO; Solicitação: EM_ANALISE, APROVADA, RECUSADA, CONCLUIDA.
- Q: O que acontece com outras solicitações em análise quando uma solicitação do mesmo animal é aprovada? → A: Recusar automaticamente as demais solicitações em análise para o mesmo animal.
- Q: A triagem de adotante é padronizada ou customizável por organização/acolhedor? → A: Triagem única e padronizada para todos os adotantes, editável a qualquer momento.
- Q: Quais dados do responsável podem aparecer na página pública do animal? → A: Apenas nome público, cidade e tipo de responsável.
- Q: Quais são as regras de fotos para o cadastro e exibição de animais? → A: Cada animal deve ter uma foto principal obrigatória e pode ter fotos adicionais ordenadas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Buscar e conhecer animais disponíveis (Priority: P1)

Visitantes e adotantes querem acessar uma vitrine pública integrada à página
inicial, filtrar animais disponíveis e abrir o perfil completo de cada animal
para decidir se desejam iniciar uma adoção.

**Why this priority**: A vitrine pública é o principal ponto de entrada para
adoções e precisa funcionar sem login para gerar interesse nos animais.

**Independent Test**: Acessar a página inicial sem sessão, aplicar filtros,
abrir um animal disponível, navegar para animal relacionado e confirmar que
ações protegidas redirecionam para login.

**Acceptance Scenarios**:

1. **Given** que há animais com status disponível, **When** o visitante acessa a
   vitrine, **Then** somente animais disponíveis são listados com foto principal,
   nome, idade, responsável e tags.
2. **Given** que o visitante aplica filtros por espécie, raça, porte, sexo,
   cidade e tags, **When** a busca é executada, **Then** a lista exibe apenas
   animais que atendem à combinação dos critérios.
3. **Given** que nenhum animal atende aos filtros, **When** a vitrine é
   atualizada, **Then** a mensagem "Nenhum animal encontrado com esses critérios"
   e a ação "Limpar filtros" são exibidas.
4. **Given** que o visitante abre um perfil de animal, **When** a página carrega,
   **Then** galeria, atributos, responsável, saúde pública, animais relacionados
   e ações disponíveis são exibidos sem dados sensíveis.
5. **Given** que um visitante clica em "Solicitar Adoção" ou "Favoritar", **When**
   ele não está autenticado, **Then** é redirecionado para login preservando o
   retorno à página original.

---

### User Story 2 - Cadastrar adotante e concluir triagem (Priority: P1)

Pessoas interessadas em adoção precisam criar conta, informar dados pessoais e
preencher uma triagem obrigatória, única e padronizada antes de solicitar um animal.

**Why this priority**: A triagem protege os animais e fornece às organizações
informações mínimas para avaliar compatibilidade e responsabilidade.

**Independent Test**: Criar uma conta de adotante, verificar redirecionamento
para triagem, bloquear solicitação antes da triagem e liberar solicitação após
conclusão.

**Acceptance Scenarios**:

1. **Given** que um visitante informa nome, CPF, e-mail, telefone e endereço
   válidos, **When** conclui o cadastro, **Then** a conta de adotante é criada e
   ele é redirecionado para `/dashboard/triagem`.
2. **Given** que o e-mail ou CPF já está cadastrado, **When** o cadastro é
   enviado, **Then** o sistema exibe "E-mail já cadastrado" ou "CPF já cadastrado".
3. **Given** que o adotante ainda não concluiu a triagem, **When** tenta
   solicitar adoção, **Then** é bloqueado e redirecionado para a triagem com
   mensagem explicativa.
4. **Given** que o adotante concluiu a triagem, **When** acessa animal disponível,
   **Then** o botão "Solicitar Adoção" fica disponível.
5. **Given** que o adotante já preencheu a triagem, **When** acessa sua área,
   **Then** pode editar as respostas a qualquer momento.

---

### User Story 3 - Solicitar adoção e acompanhar status (Priority: P1)

Adotantes com triagem concluída querem solicitar adoção de animais disponíveis,
favoritar animais de interesse e acompanhar o andamento das solicitações.

**Why this priority**: Solicitação e acompanhamento formam o fluxo central que
converte interesse público em processo real de adoção.

**Independent Test**: Com uma conta de adotante com triagem concluída, favoritar
e desfavoritar animal, criar solicitação e acompanhar seu status no painel.

**Acceptance Scenarios**:

1. **Given** que o adotante com triagem concluída abre animal disponível, **When**
   envia solicitação, **Then** uma solicitação é criada com status em análise.
2. **Given** que o adotante já possui solicitação ativa para o mesmo animal,
   **When** tenta solicitar novamente, **Then** o sistema exibe "Você já tem uma
   solicitação ativa para este animal".
3. **Given** que o animal não está disponível, **When** o adotante abre o perfil,
   **Then** o botão de solicitação não é exibido.
4. **Given** que o adotante favorito um animal, **When** acessa "Meus Favoritos",
   **Then** o animal aparece na lista.
5. **Given** que o adotante desfavorita um animal, **When** a ação é confirmada,
   **Then** o animal deixa de aparecer em seus favoritos.

---

### User Story 4 - Gerir animais e histórico de saúde (Priority: P2)

Organizações protetoras e acolhedores independentes precisam cadastrar animais,
controlar o ciclo de vida, registrar saúde, relacionar animais e receber alertas
de procedimentos próximos.

**Why this priority**: A qualidade dos dados de saúde e status sustenta a
confiança da vitrine pública e a operação diária de abrigo ou lar temporário.

**Independent Test**: Entrar como organização ou acolhedor, cadastrar animal,
alterar status, registrar saúde válida e inválida, criar vínculo bidirecional e
visualizar alerta para próximos 30 dias.

**Acceptance Scenarios**:

1. **Given** que uma organização ou acolhedor informa dados obrigatórios e fotos,
   **When** cadastra um animal, **Then** o animal fica associado exatamente a um
   responsável operacional.
2. **Given** que um responsável operacional altera o status do animal, **When**
   salva a mudança, **Then** o animal passa ao novo estado do ciclo de vida.
3. **Given** que um responsável registra vacina, controle de parasitas ou teste,
   **When** os dados são válidos, **Then** o registro aparece no painel de saúde.
4. **Given** que a data de aplicação é futura ou a próxima data não é posterior
   ao registro, **When** o registro é enviado, **Then** a mensagem de erro
   correspondente é exibida e nada é registrado.
5. **Given** que dois animais são relacionados, **When** o vínculo é salvo,
   **Then** ambas as páginas exibem o outro animal como relacionado.
6. **Given** que há vacina ou procedimento com data nos próximos 30 dias, **When**
   o responsável acessa alertas, **Then** o alerta aparece na lista.

---

### User Story 5 - Analisar e decidir solicitações de adoção (Priority: P2)

Organizações e acolhedores querem analisar solicitações dos próprios animais,
ver o perfil completo de triagem do adotante e aprovar ou recusar com
observações.

**Why this priority**: A decisão estruturada reduz risco de adoções inadequadas e
preserva histórico auditável das avaliações.

**Independent Test**: Criar solicitações para animais de responsáveis
diferentes, acessar como cada responsável, confirmar isolamento de dados, decidir
uma solicitação e verificar atualização de status.

**Acceptance Scenarios**:

1. **Given** que há solicitações para animais do responsável, **When** ele abre a
   listagem, **Then** elas aparecem ordenadas da mais recente para a mais antiga.
2. **Given** que o responsável abre uma solicitação, **When** a página carrega,
   **Then** o perfil completo de triagem do adotante é exibido somente leitura.
3. **Given** que o responsável aprova uma solicitação, **When** salva a decisão,
   **Then** a solicitação fica aprovada e o animal entra em processo de adoção.
4. **Given** que existem outras solicitações em análise para o mesmo animal,
   **When** uma solicitação é aprovada, **Then** as demais são recusadas
   automaticamente.
5. **Given** que o responsável recusa uma solicitação, **When** salva a decisão,
   **Then** a solicitação fica recusada e o animal permanece disponível.
6. **Given** que um responsável tenta acessar solicitação de outro responsável,
   **When** a página é solicitada, **Then** o acesso é negado.

---

### User Story 6 - Consultar histórico de adoções e adotantes (Priority: P3)

Organizações e acolhedores precisam ver adoções concluídas dos próprios animais
e consultar o perfil de triagem do adotante em modo somente leitura.

**Why this priority**: O histórico apoia acompanhamento pós-adoção e prestação
de contas sem expor dados de outras organizações.

**Independent Test**: Registrar adoções concluídas de diferentes responsáveis e
confirmar que cada responsável vê apenas as próprias adoções e seus respectivos
adotantes.

**Acceptance Scenarios**:

1. **Given** que existem adoções concluídas dos próprios animais, **When** o
   responsável acessa a área de adotantes, **Then** vê nome do adotante, nome do
   animal e data de conclusão.
2. **Given** que o responsável clica em uma adoção concluída, **When** abre o
   detalhe, **Then** vê o perfil de triagem do adotante somente leitura.
3. **Given** que há adoções de outro responsável, **When** o usuário atual acessa
   sua área, **Then** esses adotantes não são listados.

---

### User Story 7 - Administrar usuários e acesso (Priority: P3)

Administradores precisam listar usuários, identificar tipo e status, e ativar ou
desativar contas para proteger o sistema.

**Why this priority**: A administração de acesso é necessária para operar com
organizações, acolhedores e adotantes ao longo do tempo.

**Independent Test**: Entrar como administrador, listar usuários, desativar uma
conta e confirmar que a conta desativada não consegue usar áreas protegidas.

**Acceptance Scenarios**:

1. **Given** que há usuários cadastrados, **When** o administrador acessa a lista,
   **Then** vê nome, tipo de conta e status de cada usuário.
2. **Given** que o administrador desativa uma conta, **When** o usuário tenta
   acessar o sistema, **Then** vê "Conta desativada. Entre em contato com o
   administrador".
3. **Given** que o administrador reativa uma conta, **When** o usuário entra
   novamente, **Then** o acesso volta a seguir suas permissões de perfil.

### Edge Cases

- Animal cadastrado sem organização e sem acolhedor deve ser rejeitado.
- Animal cadastrado com organização e acolhedor ao mesmo tempo deve ser rejeitado.
- Animal relacionado a si mesmo deve exibir "Um animal não pode ser relacionado a si mesmo".
- Vínculo de animais já existente deve ser ignorado sem duplicar registros.
- Remoção de vínculo deve remover os dois sentidos do relacionamento.
- Seção de saúde sem registros de um tipo não deve ser exibida no perfil público.
- Animais relacionados sem vínculos não devem exibir seção de relacionados.
- Animal relacionado que não esteja disponível deve aparecer sem botão de solicitação.
- Visitantes e adotantes não podem criar, editar ou excluir registros de saúde.
- Organizações, acolhedores e administradores não podem favoritar animais.
- Rotas de painel sem sessão devem redirecionar para login.
- Sessão expirada deve redirecionar para login preservando retorno.
- Usuários de uma organização ou acolhedor não podem ver ou gerenciar dados de
  outra organização ou acolhedor.
- Páginas públicas de animais não devem exibir telefone, e-mail, CPF, CNPJ,
  endereço completo ou dados internos do responsável.
- Página inicial deve exibir métricas reais e manter a vitrine com os mesmos
  filtros, paginação e regras da vitrine dedicada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support public browsing of available animals without login.
- **FR-002**: System MUST display only animals with available status in the public showcase.
- **FR-003**: System MUST filter public animals by species, breed, size, sex, city and tags.
- **FR-004**: System MUST support the "Vacinado" tag based on at least one vaccine record.
- **FR-005**: System MUST support the "Castrado" tag based on the animal neutered flag.
- **FR-006**: System MUST combine multiple showcase filters correctly.
- **FR-007**: System MUST show at most 12 animals per showcase page.
- **FR-008**: System MUST show an empty-state message and clear-filters action when no animal matches filters.
- **FR-009**: System MUST provide a public animal profile with gallery, name, tags, responsible name, attributes, health summary, related animals and available actions.
- **FR-010**: System MUST hide public health sections that have no records.
- **FR-011**: System MUST hide the related-animals section when no relationship exists.
- **FR-012**: System MUST never expose adopter-sensitive data or internal organization data on public pages.
- **FR-012a**: System MUST limit public responsible-party data on animal pages to public name, city and responsible-party type.
- **FR-013**: System MUST redirect unauthenticated users to login when they try to request adoption or favorite an animal.
- **FR-014**: System MUST register adopters with name, CPF, e-mail, phone and address.
- **FR-015**: System MUST reject adopter registration with an already registered e-mail using "E-mail já cadastrado".
- **FR-016**: System MUST reject adopter registration with an already registered CPF using "CPF já cadastrado".
- **FR-017**: System MUST redirect newly registered adopters to mandatory screening.
- **FR-018**: System MUST allow adopters to edit their screening form at any time.
- **FR-018a**: System MUST use one standardized screening form for all adopters and all responsible parties.
- **FR-019**: System MUST block adoption requests from adopters without completed screening and redirect them to screening with an explanatory message.
- **FR-020**: System MUST allow screened adopters to request adoption for available animals.
- **FR-021**: System MUST create adoption requests with status in analysis.
- **FR-021a**: System MUST restrict animal lifecycle status to RESGATADO, EM_CUIDADOS, DISPONIVEL, EM_PROCESSO_ADOCAO and ADOTADO.
- **FR-021b**: System MUST restrict adoption request status to EM_ANALISE, APROVADA, RECUSADA and CONCLUIDA.
- **FR-022**: System MUST prevent duplicate active adoption requests by the same adopter for the same animal.
- **FR-023**: System MUST not display the request action for animals that are not available.
- **FR-024**: System MUST allow adopters to favorite and unfavorite animals.
- **FR-025**: System MUST show adopter favorites in "Meus Favoritos".
- **FR-026**: System MUST prevent organization, foster and administrator profiles from favoriting animals.
- **FR-027**: System MUST allow organizations and independent fosters to create animals with name, species, breed, size, sex, color, neutered status, description and photos.
- **FR-027a**: System MUST require one primary photo for each animal and allow additional ordered photos.
- **FR-028**: System MUST require every animal to belong to exactly one responsible party: an organization or an independent foster.
- **FR-029**: System MUST allow responsible users to change animal lifecycle status.
- **FR-030**: System MUST allow responsible users to register vaccines from a catalog or as custom vaccine names.
- **FR-031**: System MUST mark catalog vaccines as not customized and custom "Outra" vaccines as customized.
- **FR-032**: System MUST allow responsible users to register parasite control with medication type and frequency.
- **FR-033**: System MUST allow responsible users to register disease tests only with positive or negative results.
- **FR-034**: System MUST reject future application dates with "Data de aplicação não pode ser futura".
- **FR-035**: System MUST reject next dates that are not later than the registration date with "Data próxima deve ser posterior ao registro".
- **FR-036**: System MUST deny health record creation, editing and deletion to visitors and adopters.
- **FR-037**: System MUST create animal relationships bidirectionally in a single operation.
- **FR-038**: System MUST remove animal relationships bidirectionally in a single operation.
- **FR-039**: System MUST reject self-relationships with "Um animal não pode ser relacionado a si mesmo".
- **FR-040**: System MUST ignore duplicate animal relationships without creating duplicates.
- **FR-041**: System MUST list adoption requests for each responsible user ordered by newest first.
- **FR-042**: System MUST show the complete adopter screening profile when a responsible user reviews a request for their own animal.
- **FR-043**: System MUST allow responsible users to approve a request with observations.
- **FR-044**: System MUST set an approved request to approved and move the animal to adoption-in-process.
- **FR-044a**: System MUST automatically refuse all other in-analysis requests for the same animal when one request is approved.
- **FR-045**: System MUST allow responsible users to refuse a request with observations.
- **FR-046**: System MUST keep the animal available when a request is refused.
- **FR-047**: System MUST deny access when a responsible user attempts to see or manage another responsible party's request.
- **FR-048**: System MUST show completed adoptions for each responsible user's own animals only.
- **FR-049**: System MUST show adopter name, animal name and completion date in the completed-adoptions list.
- **FR-050**: System MUST show read-only adopter screening details from a completed adoption.
- **FR-051**: System MUST show upcoming vaccine and procedure alerts for the next 30 days.
- **FR-052**: System MUST list all users for administrators with user type and status.
- **FR-053**: System MUST allow administrators to activate and deactivate any account.
- **FR-054**: System MUST block deactivated users with "Conta desativada. Entre em contato com o administrador".
- **FR-055**: System MUST redirect unauthenticated dashboard access to login.
- **FR-056**: System MUST deny adopters access to animal-management areas.
- **FR-057**: System MUST preserve a return destination when login is required for protected actions.
- **FR-058**: System MUST show real current operational metrics on the home page.
- **FR-059**: System MUST provide a "Ver animais disponíveis" home CTA that anchors to the showcase on the same page.
- **FR-060**: System MUST provide a "Sou uma organização" home CTA that leads to organization registration.

### Constitution Requirements *(mandatory)*

- **CR-001**: Requirements MUST NOT introduce abstractions beyond the stated product behaviors for rescue intake, animal management, health records, adoption requests, favorites, access control and administration.
- **CR-002**: Data requirements MUST identify source-of-truth entities for users, adopters, screening, organizations, independent fosters, animals, photos, health records, animal relationships, favorites and adoption requests.
- **CR-003**: Business rules MUST be enforced as trusted server-side behavior, including eligibility to request adoption, organization data isolation, status transitions and health-record authorization.
- **CR-004**: Protected data access MUST require an authenticated active user before showing dashboard data, screening profiles, adoption requests, favorites or management actions.
- **CR-005**: User input MUST have client-facing validation feedback and trusted server-side validation for registration, screening, animal forms, health records, relationships, favorites, requests and decisions.
- **CR-006**: Client state requirements MUST stay limited to form input, filter controls, pagination, selected tabs and transient UI feedback.
- **CR-007**: New dependency requirements MUST be rejected unless the existing project stack cannot satisfy the needed user behavior.
- **CR-008**: Entity typing requirements MUST derive from the project source of truth and must not rely on untyped entity shapes.

### Key Entities *(include if feature involves data)*

- **User**: Account used for authentication and access control; includes identity, role/type, active/inactive status and contact identity fields.
- **Adopter Profile**: Personal adopter data including name, CPF, e-mail, phone and address.
- **Screening Form**: Standardized structured adopter questionnaire required before adoption requests; linked to one adopter and editable.
- **Organization**: Protective organization profile, including cases with formal registration and shelter operation.
- **Independent Foster**: Individual responsible for animals without requiring organization structure or headquarters.
- **Animal**: Rescued animal with name, species, breed, size, sex, color, neutered status, description, lifecycle status, city and exactly one responsible party.
- **Animal Photo**: Photo associated with an animal, including one mandatory primary display photo and optional additional photos with display order.
- **Health Record**: Animal health history entry covering vaccines, parasite control and disease tests, with dates, type-specific details and next due date when applicable.
- **Vaccine Catalog Item**: Reusable vaccine name that can be selected when registering vaccine records.
- **Animal Relationship**: Bidirectional relationship between two different animals.
- **Favorite**: Saved animal reference owned by an adopter.
- **Adoption Request**: Request from an adopter for one animal, including status, request date, decision observations and decision history.
- **Completed Adoption**: Finalized adoption record linking animal, adopter and completion date for historical consultation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of visitors can find and open a public animal profile from the home page in under 2 minutes during usability testing.
- **SC-002**: Public searches with filters return a visible result, empty state or pagination update in under 2 seconds for typical Volta Redonda/RJ shelter data volumes.
- **SC-003**: 100% of adoption attempts by adopters without completed screening are blocked and redirected to screening.
- **SC-004**: 100% of public animal pages exclude adopter-sensitive data and internal organization data in content review.
- **SC-005**: Responsible users can register a valid animal and at least one valid health record in under 5 minutes.
- **SC-006**: 100% of unauthorized attempts to manage another responsible party's animals, health records, requests or adopters are denied.
- **SC-007**: Responsible users can review a request, inspect screening answers and approve or refuse it in under 3 minutes.
- **SC-008**: The system supports operational use for both an informal foster network and a formal shelter with 100 or more animals without code changes.
- **SC-009**: At least 90% of validation failures in registration, animal, health and request flows show the required explanatory message without losing already entered form data.
- **SC-010**: Administrators can locate and activate or deactivate any account in under 1 minute.

## Assumptions

- The initial operational geography is Volta Redonda/RJ, but city is stored as a filterable animal attribute to support future expansion.
- A responsible party is either an organization or an independent foster; both models share the same animal and adoption workflow.
- Organization registration exists as an entry route for protective organizations; detailed approval of organizations is outside this feature unless added later.
- Adopter screening content is treated as private and shown only to the adopter, authorized responsible users reviewing their own animals, and administrators if future governance permits.
- Adoption request statuses are EM_ANALISE, APROVADA, RECUSADA and CONCLUIDA.
- Animal lifecycle statuses are RESGATADO, EM_CUIDADOS, DISPONIVEL, EM_PROCESSO_ADOCAO and ADOTADO.
- Health information visible publicly is limited to animal health summary data useful for adoption decisions, not internal notes or adopter data.
- Metrics on the home page are aggregate operational counts and do not expose sensitive personal information.
