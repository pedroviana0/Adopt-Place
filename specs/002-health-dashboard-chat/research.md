# Research: Health Operations Dashboard and Adoption Chat

## Decision: Persist planned care as `CuidadoPlanejado`

**Rationale**: The current app derives simple alerts directly from `RegistroSaude.dataProxima`, but the new feature requires reschedule, cancel/discard, completion idempotency, manual CONSULTA events, filters, and no duplicate alerts. A concrete planned-care row gives one mutable future occurrence and supports atomic completion. To preserve compatibility, existing `RegistroSaude.dataProxima` remains, and each record with `dataProxima` owns at most one planned-care row through `origemRegistroSaudeId`.

**Alternatives considered**:

- Derive all agenda items from `RegistroSaude.dataProxima`: rejected because reschedule/cancel/completion state would need hidden state elsewhere or duplicate logic.
- Store separate `Alerta`: rejected by spec; alert is a derived classification, not a user-created concept.
- Recurrence engine: rejected as out of scope and unnecessary for MVP.

## Decision: Keep CONSULTA out of `TipoRegistroSaude`

**Rationale**: The current `RegistroSaude` enum has health facts. The spec definitively states CONSULTA is only a future agenda/alert event and never health history. Therefore CONSULTA belongs only to planned-care type, and completing it updates `CuidadoPlanejado.status = CONCLUIDO` without creating a health record.

**Alternatives considered**:

- Add CONSULTA to `TipoRegistroSaude`: rejected because it violates spec and public health history rules.
- Represent CONSULTA as document only: rejected because it needs agenda date, reschedule, cancel, and completion.

## Decision: Add only additive fields and enum values to `RegistroSaude`

**Rationale**: Existing vaccine, parasite, and test rows must remain valid. Add `MEDICAMENTO_TRATAMENTO` and `PROCEDIMENTO` to `TipoRegistroSaude`, plus optional fields (`titulo`, `observacoes`, `profissionalClinica`, `procedimento`, `medicamentoTratamento`) without renaming existing columns. Existing `dataRegistro`, `dataProxima`, `responsavelRegistro`, `nomeVacina`, `tipoMedicamento`, `frequencia`, `nomeDoenca`, and `resultado` stay compatible.

**Alternatives considered**:

- Split health record subtype tables: rejected as over-engineering for five categories and current MVP forms.
- Rename fields for semantic polish: rejected because it increases migration risk without user value.

## Decision: Create/release chat in the approval transaction

**Rationale**: `decideAdoptionRequest` already uses one transaction for approval, animal status update, and automatic refusal of competing requests. Adding `ConversaAdocao.upsert` or create guarded by `@@unique(solicitacaoId)` inside that transaction preserves existing behavior and prevents duplicate conversations in sequential and concurrent approval attempts.

**Alternatives considered**:

- Lazy-create conversation when the first participant opens it: rejected because tests need approval to release exactly one conversation and because it spreads state transition rules across read paths.
- Create conversation at request creation: rejected because chat before approval is out of scope.

## Decision: Use `ConversaParticipante` for read state

**Rationale**: The chat has exactly two participants, but read state belongs to each participant and unread counters need efficient per-user queries. A small participant table with `usuarioId`, `ultimaLeituraEm`, and optional profile IDs keeps authorization and unread logic direct while avoiding nullable per-role columns on the conversation.

**Alternatives considered**:

- Store `adotanteLidoEm` and `responsavelLidoEm` on `ConversaAdocao`: simpler initially, but less direct for global unread queries by session user and requires role-specific branching everywhere.
- Store per-message read rows: rejected as unnecessary complexity for two participants.

## Decision: Use server time and configured application timezone boundaries

**Rationale**: Mutations use server timestamps. Alert groups use an application timezone constant for day boundaries (`America/Sao_Paulo` unless existing deployment config defines another value). Query code computes start/end of today, next 7 days, and next 30 days on the server before querying.

**Alternatives considered**:

- Browser-local timezone grouping: rejected because dashboard counts could vary by client.
- UTC day boundaries only: rejected because spec requires application timezone.

## Decision: Reuse Uploadthing with a dedicated health document route

**Rationale**: The repo already has Uploadthing and an `app/api/uploadthing` Route Handler. Add `healthDocument` to `lib/upload-router.ts` with `image` and `pdf` support, max 10 MB, owner check before upload, and document metadata creation on completion. Public queries never select `DocumentoSaude`.

**Alternatives considered**:

- New storage dependency: rejected by constitution because Uploadthing already exists.
- Store documents as public photo records: rejected because documents are internal and require type/metadata/deletion rules.

## Decision: Dashboard aggregates are query-level server calculations

**Rationale**: The current dashboard loads full animals/requests and calculates some values in the component. The new dashboard needs clickable isolated metrics and recent activity without client aggregation. A dedicated `getOperationalDashboard` query should use Prisma counts/grouping and bounded selects by responsible ownership.

**Alternatives considered**:

- Keep full-list loading and reduce in component: rejected because it risks N+1, client aggregation, and accidental cross-owner data.
- Add generic audit log for activity: rejected by spec; use existing timestamps first.

## Decision: Polling uses a required narrow read endpoint

**Rationale**: Server-rendered pages and Server Actions cover initial list/detail/send/read flows. Periodic refresh without WebSocket uses a small authorized Route Handler that returns conversation messages after a cursor or timestamp. This is not a business mutation endpoint and remains scoped to chat read refresh.

**Alternatives considered**:

- WebSocket or realtime provider: rejected as out of scope.
- Full page refresh only: rejected because the feature requires periodic polling through the narrow read endpoint without adding dependencies.

## Decision: Message text is rendered as plain text

**Rationale**: Messages are user-provided text and must not execute HTML. Store raw text after trim/length validation and render as text nodes, not via HTML injection.

**Alternatives considered**:

- Markdown/HTML formatting: rejected as unnecessary scope and security surface.
