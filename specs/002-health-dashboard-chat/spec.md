# Feature Specification: Health Operations Dashboard and Adoption Chat

**Feature Branch**: `002-health-dashboard-chat`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Feature incremental para AdoptPlace baseada na feature 001-animal-adoption-management, ampliando o produto com Central de Saude operacional, Painel Operacional e Chat da Adocao, preservando requisitos, schema e contratos existentes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operar a Central de Saude (Priority: P1)

Organizacoes protetoras e acolhedores independentes precisam de uma area de Saude para acompanhar cuidados dos proprios animais, registrar fatos realizados, gerir consultas futuras e manter documentos internos sem expor dados publicos indevidos.

**Why this priority**: A rotina de saude e o maior risco operacional imediato para animais resgatados; atrasos, duplicidades e exposicao indevida de documentos afetam diretamente cuidado, confianca e seguranca.

**Independent Test**: Entrar como ORGANIZACAO ou ACOLHEDOR com animais proprios, criar registros com proxima data, registrar consultas futuras, concluir/reagendar/cancelar pendencias, anexar documentos validos e confirmar isolamento e ausencia de exposicao publica.

**Acceptance Scenarios**:

1. **Given** que uma vacina de animal proprio possui proxima data, **When** o responsavel abre a agenda de saude, **Then** o cuidado aparece uma unica vez no agrupamento temporal correto.
2. **Given** que um cuidado planejado venceu antes da data atual da aplicacao, **When** o responsavel abre a visao geral ou agenda, **Then** o cuidado aparece como atrasado.
3. **Given** que um cuidado planejado de vacina, controle de parasitas, teste, tratamento ou procedimento esta pendente, **When** o responsavel marca como realizado e informa os dados reais, **Then** um novo registro de saude da categoria correta e criado e a pendencia anterior e encerrada.
4. **Given** que uma consulta futura foi cadastrada manualmente, **When** chega sua data, **Then** ela aparece nos alertas e pode ser reagendada, cancelada ou concluida sem criar registro de historico do tipo consulta.
5. **Given** que um animal proprio possui teste de doenca com resultado POSITIVO, **When** o responsavel abre a visao geral de saude, **Then** o animal aparece destacado como demandando atencao.
6. **Given** que um animal proprio nao possui registros de saude, **When** a visao geral e carregada, **Then** o animal aparece em "sem historico".
7. **Given** que um usuario de outro responsavel tenta acessar registro, agenda ou documento de animal que nao lhe pertence, **When** a pagina ou acao e solicitada, **Then** o acesso e negado antes de exibir ou alterar dados.
8. **Given** que o responsavel anexa PDF ou imagem valida de ate 10 MB, **When** o envio e confirmado, **Then** o documento fica vinculado ao animal e seus metadados internos ficam visiveis ao responsavel.
9. **Given** que um arquivo tem tipo nao permitido ou excede o limite de tamanho aplicavel, **When** o responsavel tenta anexar, **Then** o sistema rejeita o arquivo com mensagem clara e nao cria documento.
10. **Given** que visitante ou ADOTANTE abre o perfil publico do animal, **When** existe documento, observacao interna, clinica, profissional ou agenda, **Then** esses dados nunca aparecem publicamente.

---

### User Story 2 - Usar o Painel Operacional (Priority: P2)

Organizacoes e acolhedores precisam de um painel que responda "o que precisa da minha atencao agora?" com indicadores clicaveis, pendencias priorizadas, funil de adocao, resumo dos animais e atividade recente baseada em dados reais dos proprios registros.

**Why this priority**: O painel reduz tempo de decisao diaria e conecta o responsavel diretamente aos fluxos que resolvem pendencias de saude e adocao.

**Independent Test**: Entrar como responsavel com dados proprios, conferir indicadores e pendencias, clicar em cada indicador para abrir a listagem filtrada, alterar dados de saude/adocao e verificar atualizacao das metricas.

**Acceptance Scenarios**:

1. **Given** que existem solicitacoes EM_ANALISE para animais proprios, **When** o responsavel clica no indicador de solicitacoes aguardando analise, **Then** a listagem de solicitacoes abre filtrada em analise.
2. **Given** que existem cuidados atrasados para animais proprios, **When** o responsavel clica no indicador de cuidados atrasados, **Then** a agenda de saude abre filtrada como atrasada.
3. **Given** que um animal e cadastrado, uma solicitacao e aprovada/concluida ou um cuidado de saude e registrado, **When** o painel e recarregado, **Then** as metricas refletem a fonte de verdade atual.
4. **Given** que um responsavel ainda nao possui animais, solicitacoes ou cuidados, **When** abre o painel, **Then** ve estados vazios uteis e acoes de primeiro passo.
5. **Given** que existem animais ou solicitacoes de outro responsavel, **When** o painel calcula metricas, **Then** nenhum valor agrega dados que nao pertencem ao usuario atual.

---

### User Story 3 - Conversar apos aprovacao da adocao (Priority: P2)

Adotantes e responsaveis precisam trocar mensagens privadas vinculadas a uma solicitacao aprovada para combinar busca ou entrega do animal, com historico preservado e sem revelar contatos automaticamente.

**Why this priority**: Depois da aprovacao, a comunicacao organizada reduz perda de contexto e apoia a conclusao da adocao sem criar canal aberto antes da decisao.

**Independent Test**: Aprovar uma solicitacao, abrir a conversa como responsavel e adotante, enviar mensagens validas, conferir nao lidas, negar acesso a terceiros e arquivar a conversa ao concluir a adocao.

**Acceptance Scenarios**:

1. **Given** que uma solicitacao e aprovada, **When** a aprovacao e finalizada, **Then** exatamente uma conversa fica disponivel para o ADOTANTE solicitante e o responsavel pelo animal.
2. **Given** que uma solicitacao e recusada ou permanece EM_ANALISE, **When** usuario tenta abrir conversa, **Then** nenhuma conversa e criada ou liberada.
3. **Given** que a conversa esta ativa, **When** adotante e responsavel enviam textos validos, **Then** ambos veem o historico cronologico e contagens de nao lidas coerentes.
4. **Given** que terceiro, outro responsavel ou outro adotante tenta acessar a conversa, **When** a pagina ou envio e solicitado, **Then** o acesso e negado.
5. **Given** que a adocao passa para CONCLUIDA, **When** a conversa e aberta, **Then** o historico permanece visivel aos participantes, mas novos envios sao bloqueados.
6. **Given** que uma mensagem esta vazia, excede 2.000 caracteres ou pertence a conversa arquivada, **When** o envio e tentado, **Then** a mensagem e rejeitada sem persistencia.
7. **Given** que duas operacoes concorrentes tentam liberar conversa para a mesma solicitacao aprovada, **When** ambas terminam, **Then** existe no maximo uma conversa vinculada a solicitacao.

### Edge Cases

- Uma proxima data originada de registro de saude nao pode gerar alertas duplicados na agenda nem por recarregamento nem por reagendamento.
- Reagendar cuidado planejado deve atualizar a unica ocorrencia planejada aplicavel.
- Concluir o mesmo cuidado futuro duas vezes deve ser impedido mesmo em tentativas concorrentes.
- Uma consulta concluida nao deve aparecer na linha do tempo de historico de saude.
- Um animal com apenas documentos, mas sem registros de saude realizados, continua sendo considerado "sem historico".
- Documento ligado a registro de saude excluido deve manter regra definida de integridade: permanecer vinculado ao animal e perder apenas o vinculo opcional com o registro, salvo exclusao do animal.
- Exclusao de documento exige confirmacao e nao deve apagar o registro de saude associado.
- Filtros vazios de agenda, documentos, mensagens ou painel devem exibir estado vazio acionavel.
- Erros de carregamento devem apresentar mensagem recuperavel sem expor detalhes internos.
- Datas de agrupamento de alertas devem usar o fuso horario da aplicacao para classificar atrasado, hoje, proximos 7 dias e proximos 30 dias.
- Indicadores do painel nunca podem ser decorativos: cada item clicavel deve abrir listagem correspondente filtrada.
- Atividade recente deve usar eventos e timestamps existentes quando suficientes; nao deve criar log generico apenas para preencher a lista.
- ADMIN nao deve ler conversas automaticamente e so deve ver indicadores de nao lidas quando houver regra explicita futura.
- Mensagens nao devem aceitar anexos, edicao ou exclusao no MVP.
- O painel do ADOTANTE e o painel do ADMIN devem ser preservados, exceto por indicadores de mensagens nao lidas quando aplicavel ao perfil.
- Aprovacao de solicitacao deve preservar a recusa automatica das solicitacoes concorrentes ja definida na feature 001.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Saude" area only for ORGANIZACAO and ACOLHEDOR users.
- **FR-002**: System MUST restrict all Saude area data and actions to animals owned by the authenticated responsible party.
- **FR-003**: System MUST deny visitors and ADOTANTE users access to the Saude area and internal health documents.
- **FR-004**: System MUST provide a health overview with counts or lists for overdue care, care due today, care due in the next 7 days, care due in the next 30 days, animals without any health history, and animals with positive disease tests requiring attention.
- **FR-005**: System MUST classify health alerts as overdue, today, next 7 days, or next 30 days using the application timezone.
- **FR-006**: System MUST derive health alerts from planned future care and from health records that contain a next date; alerts MUST NOT be registered as a separate manual concept.
- **FR-007**: System MUST ensure a health record with a next date produces or exposes exactly one corresponding future care item in the agenda.
- **FR-008**: System MUST provide a chronological health agenda with filters by animal, care type, status, and period.
- **FR-009**: System MUST derive agenda status from dates unless the item is completed or cancelled.
- **FR-010**: Responsible users MUST be able to open the animal from an agenda item.
- **FR-011**: Responsible users MUST be able to mark planned care as completed, reschedule it, or cancel/discard it with confirmation.
- **FR-012**: Rescheduling planned care MUST update the single planned occurrence and MUST NOT create duplicate alerts.
- **FR-013**: Cancelling or discarding planned care MUST require explicit confirmation and preserve the completed health history.
- **FR-014**: System MUST prevent a planned care item from being completed more than once, including concurrent attempts.
- **FR-015**: System MUST allow CONSULTA only as a manually created future agenda event with animal, date/time, title, optional notes, and optional location/professional.
- **FR-016**: CONSULTA events MUST generate date-based alerts and allow rescheduling, cancellation, and completion.
- **FR-017**: Completing a CONSULTA MUST NOT create or display a CONSULTA entry in health history.
- **FR-018**: Exams, formalized tests, diagnoses represented as tests, medications, treatments, procedures, and documents resulting from a consultation MUST be recorded separately in the appropriate allowed category.
- **FR-019**: System MUST provide a per-animal health history timeline of completed facts only.
- **FR-020**: Health history categories MUST be limited to VACINA, CONTROLE_PARASITAS, TESTE_DOENCA, MEDICAMENTO_TRATAMENTO, and PROCEDIMENTO.
- **FR-021**: PROCEDIMENTO MUST be able to represent surgery or another procedure through its title/procedure field.
- **FR-022**: CONSULTA MUST NOT be an allowed health history category and MUST never be displayed as a health history record.
- **FR-023**: Health history entries MUST allow title/procedure, completion date, notes, optional professional or clinic, result when applicable, and next date when applicable.
- **FR-024**: Existing vaccine, parasite control, and disease test rules from feature 001 MUST remain valid and unchanged.
- **FR-025**: Disease tests MUST continue to accept only POSITIVO or NEGATIVO when a result is required.
- **FR-026**: Completion dates for health facts MUST reject future dates.
- **FR-027**: Next dates MUST be later than the completed fact date when provided.
- **FR-028**: Completing planned care for VACINA, CONTROLE_PARASITAS, TESTE_DOENCA, MEDICAMENTO_TRATAMENTO, or PROCEDIMENTO MUST collect the actual completion data and create the corresponding health record.
- **FR-029**: Completing planned care MUST close or mark the prior planned occurrence so it no longer appears as pending.
- **FR-030**: System MUST provide a health documents area for responsible users.
- **FR-031**: Each health document MUST belong to exactly one animal and MAY optionally link to one health record.
- **FR-032**: Health document types MUST be EXAME, RECEITA, LAUDO, COMPROVANTE_VACINACAO, or OUTRO.
- **FR-033**: Health documents MUST allow only image or PDF files.
- **FR-034**: Health document upload MUST reject files above the safest applicable limit; if no stricter baseline exists, the MVP limit MUST be 10 MB per file.
- **FR-035**: Invalid document type or size MUST show a clear message and MUST NOT create a document record.
- **FR-036**: Responsible users MUST be able to view document metadata, open or download the file, and delete the document with confirmation.
- **FR-037**: Health documents MUST be internal and MUST never appear on public animal profiles or adopter-facing views.
- **FR-038**: The existing public health summary MUST continue to show only previously allowed public data and MUST never expose documents, internal notes, professional/clinic details, or agenda items.
- **FR-039**: Only the ORGANIZACAO or ACOLHEDOR responsible for the animal MAY create, edit, complete, reschedule, cancel, or delete its health records, events, and documents.
- **FR-040**: System MUST reformulate the ORGANIZACAO and ACOLHEDOR dashboard around immediate operational attention.
- **FR-041**: Operational dashboard metrics MUST be calculated from source-of-truth data for the authenticated responsible party only.
- **FR-042**: Operational dashboard MUST include clickable indicators for available animals, animals in care, animals in adoption process, adoption requests waiting for review, overdue health care, and health care in the next 7 days.
- **FR-043**: Each dashboard indicator MUST open the appropriate list already filtered to the represented data.
- **FR-044**: Operational dashboard MUST show prioritized pending items in this order: overdue health, care due today, request waiting for analysis, and approved adoption waiting for completion.
- **FR-045**: Each prioritized pending item MUST open directly into the flow where it can be resolved.
- **FR-046**: Operational dashboard MUST show adoption funnel counts for in analysis, approved/in process, and completed in the selected period.
- **FR-047**: Operational dashboard MUST show animal summary counts across RESGATADO, EM_CUIDADOS, DISPONIVEL, EM_PROCESSO_ADOCAO, and ADOTADO.
- **FR-048**: Operational dashboard MUST show recent activity based on existing events such as animal created, health registered, request received, request approved, and adoption completed when those timestamps are available.
- **FR-049**: System MUST NOT create a generic audit log solely to populate recent activity when existing timestamps and entities are sufficient.
- **FR-050**: Operational dashboard MUST provide quick actions to register animal, register health care, review requests, and open health agenda.
- **FR-051**: Operational dashboard MUST provide loading, empty, and error states.
- **FR-052**: Operational dashboard MUST remain usable at a viewport width of 375 px without loss of required content or actions.
- **FR-053**: Operational dashboard MUST NOT expose data from another responsible party in metrics, lists, pending items, activity, or drill-down navigation.
- **FR-054**: The ADOTANTE dashboard and ADMIN dashboard MUST be preserved, with only necessary additions for unread message indicators introduced by this feature.
- **FR-055**: System MUST provide private adoption messages linked to adoption requests.
- **FR-056**: There MUST be at most one conversation per adoption request.
- **FR-057**: A conversation MUST be created or released only when the adoption request transitions to APROVADA.
- **FR-058**: Adoption requests in EM_ANALISE or RECUSADA MUST NOT allow a conversation.
- **FR-059**: Conversation participants MUST be exclusively the requesting ADOTANTE and the ORGANIZACAO or ACOLHEDOR responsible for the animal.
- **FR-060**: ADMIN users MUST NOT automatically read or access adoption conversations.
- **FR-061**: Messages MUST contain an author participant, text, and server date/time.
- **FR-062**: Message text MUST reject empty or whitespace-only content.
- **FR-063**: Message text MUST be limited to 2,000 characters in the MVP.
- **FR-064**: Chat MUST NOT allow attachments, message editing, or message deletion in the MVP.
- **FR-065**: System MUST track read state per participant and display unread counters.
- **FR-066**: Opening a conversation MUST mark visible received messages as read for that participant.
- **FR-067**: When the adoption request transitions to CONCLUIDA, the conversation MUST become archived and read-only while preserving history.
- **FR-068**: No user may access or send messages in a conversation for another request where they are not an allowed participant.
- **FR-069**: Chat MUST NOT reveal phone, e-mail, address, or other contact details automatically.
- **FR-070**: Periodic refresh or polling is sufficient for message updates; real-time delivery is outside the MVP.
- **FR-071**: System MUST provide a "Mensagens" area for adopters and responsible users.
- **FR-072**: Message list MUST show animal, counterparty, last message, time, active/archived state, and unread count.
- **FR-073**: Message list MUST support filters for active and archived conversations.
- **FR-074**: Conversation detail MUST show chronological history and a send action only while active.
- **FR-075**: Approved adoption request detail MUST include an "Abrir conversa" action for authorized participants.
- **FR-076**: Navigation and applicable dashboards MUST show a global unread message indicator.
- **FR-077**: Concurrent approvals or conversation-release attempts MUST NOT create duplicate conversations.
- **FR-078**: Approval of one adoption request MUST continue to automatically refuse competing in-analysis requests for the same animal as defined in feature 001.
- **FR-079**: Isolation by responsible party, chat authorization, request approval, and planned-care completion MUST have automated tests before implementation of each critical path is considered complete.
- **FR-080**: User input for health, documents, dashboard filters, and messages MUST provide user-facing validation and trusted server-side validation.

### Constitution Requirements *(mandatory)*

- **CR-001**: Requirements MUST remain incremental and MUST NOT introduce abstractions beyond the stated product behaviors for health operations, operational dashboard, and approved-adoption chat.
- **CR-002**: Data requirements MUST identify source-of-truth schema entities, fields, relationships, and constraints for animals, health records, planned care, health documents, adoption requests, conversations, messages, and read state.
- **CR-003**: Business rules MUST be enforced as trusted server-side behavior, including ownership isolation, health agenda derivation, completion idempotency, adoption approval, conversation release, unread counters, and chat archiving.
- **CR-004**: Protected data access MUST require an authenticated active user before showing or changing health, dashboard, adoption request, document, or chat data.
- **CR-005**: User input MUST have immediate client-facing validation feedback and trusted server-side validation for health records, agenda events, documents, dashboard filters, and messages.
- **CR-006**: Client state requirements MUST stay limited to form input, filter controls, selected tabs, open dialogs, transient sending/uploading state, unread visual state, and periodic refresh display state.
- **CR-007**: New dependency requirements MUST be rejected unless existing project capabilities cannot satisfy the specified behavior.
- **CR-008**: Entity typing requirements MUST derive from the project source of truth and MUST keep strict typing without explicit untyped entity shapes.
- **CR-009**: Critical paths for responsible-party isolation, chat authorization, request approval, and planned-care completion MUST be covered by tests before implementation tasks are accepted.

### Key Entities *(include if feature involves data)*

- **Usuario**: Authenticated account with role and active status; determines whether the user can act as ADOTANTE, ORGANIZACAO, ACOLHEDOR, or ADMIN.
- **Organizacao**: Responsible party profile that owns animals and may operate health, dashboard, requests, and approved-adoption chat for its animals only.
- **AcolhedorIndependente**: Independent responsible party profile with the same operational ownership rules as Organizacao for its own animals.
- **Adotante**: Adoption requester who may participate in chat only for their own approved or completed adoption requests.
- **Animal**: Rescued animal with canonical lifecycle status and exactly one responsible party; anchors health records, planned care, documents, dashboard metrics, and adoption requests.
- **RegistroSaude**: Completed health fact for an animal, using allowed categories VACINA, CONTROLE_PARASITAS, TESTE_DOENCA, MEDICAMENTO_TRATAMENTO, and PROCEDIMENTO, with completion date and optional next date.
- **CuidadoPlanejado**: Future agenda occurrence for an animal, either derived from a health record next date or manually registered as CONSULTA, with planned date/time, status, title, optional details, and link to the originating record when applicable.
- **DocumentoSaude**: Internal animal document of type EXAME, RECEITA, LAUDO, COMPROVANTE_VACINACAO, or OUTRO, with file metadata, animal ownership, and optional health-record relationship.
- **SolicitacaoAdocao**: Adoption request with canonical status; approval releases chat and must preserve automatic refusal of competing in-analysis requests.
- **ConversaAdocao**: Private conversation linked one-to-one with an approved or completed adoption request, with active or archived state and exactly two participants.
- **MensagemAdocao**: Text message in a conversation with author participant, server timestamp, and immutable content for the MVP.
- **LeituraConversa**: Per-participant read marker used to calculate unread counts and mark visible received messages as read.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Responsible users can identify overdue, today, next-7-day, and next-30-day health obligations for their own animals in under 1 minute.
- **SC-002**: 100% of health agenda items derived from a next date appear no more than once in agenda and overview checks.
- **SC-003**: 100% of unauthorized attempts by visitors, adopters, other responsible parties, or unrelated users to access health documents, health actions, dashboard data, or conversations are denied.
- **SC-004**: Responsible users can complete or reschedule a planned health care item in under 2 minutes without creating duplicate pending items.
- **SC-005**: 100% of CONSULTA completions preserve agenda history without creating a CONSULTA health history record.
- **SC-006**: 100% of public animal profile reviews exclude health documents, internal notes, clinic/professional details, and agenda items.
- **SC-007**: Responsible users can answer the panel question "what needs attention now?" and open the matching resolution flow within 2 clicks for each priority item.
- **SC-008**: Dashboard metrics reflect changes from animal creation, request approval, adoption completion, and health registration after the next normal page refresh.
- **SC-009**: At 375 px viewport width, all required dashboard indicators, pending items, quick actions, and unread indicators remain readable and actionable.
- **SC-010**: Approved adoption requests release exactly one conversation in 100% of sequential and concurrent release attempts.
- **SC-011**: Participants can exchange valid chat messages and see coherent unread counts after opening and reading conversations in 100% of acceptance tests.
- **SC-012**: 100% of empty, over-limit, archived, or unauthorized message sends are rejected without persisting a message.

## Assumptions

- The existing feature 001 contracts, status enums, ownership model, public animal profile rules, and automatic refusal of competing adoption requests are the baseline and remain authoritative.
- The application timezone is the timezone already used by the deployed AdoptPlace application; all relative alert groupings use that same timezone.
- A manually created CONSULTA is an operational agenda event, not medical history; medical facts that result from a consultation are recorded separately in the permitted categories.
- The MVP document upload limit is 10 MB per file unless an existing baseline limit is stricter.
- Periodic refresh is acceptable for chat message updates in the MVP.
- Existing timestamps and entities should be used for recent dashboard activity when they can represent the required activity accurately.
