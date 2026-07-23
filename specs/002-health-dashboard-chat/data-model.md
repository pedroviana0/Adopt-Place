# Data Model: Health Operations Dashboard and Adoption Chat

## Existing Baseline

Feature 001 remains authoritative for `Usuario`, `Adotante`, `Organizacao`, `AcolhedorIndependente`, `Animal`, `RegistroSaude`, `SolicitacaoAdocao`, photos, favorites, and relationships. This feature only adds data needed for health agenda/documents, operational dashboard inputs, and approved-adoption chat.

## Enum Changes

### TipoRegistroSaude

Existing values preserved: `VACINA`, `CONTROLE_PARASITAS`, `TESTE_DOENCA`.

Additive values:

- `MEDICAMENTO_TRATAMENTO`
- `PROCEDIMENTO`

`CONSULTA` is intentionally not part of this enum.

### TipoCuidadoPlanejado

- `VACINA`
- `CONTROLE_PARASITAS`
- `TESTE_DOENCA`
- `MEDICAMENTO_TRATAMENTO`
- `PROCEDIMENTO`
- `CONSULTA`

### StatusCuidadoPlanejado

- `PENDENTE`
- `CONCLUIDO`
- `CANCELADO`

Date-derived labels (`ATRASADO`, `HOJE`, `PROXIMO`) are not stored; they are calculated from `dataHoraPlanejada`, `status`, and application timezone.

### TipoDocumentoSaude

- `EXAME`
- `RECEITA`
- `LAUDO`
- `COMPROVANTE_VACINACAO`
- `OUTRO`

### StatusConversaAdocao

- `ATIVA`
- `ARQUIVADA`

## Model Changes

### RegistroSaude

Completed health fact for an animal.

**Existing fields preserved**: `id`, `animalId`, `tipo`, `dataRegistro`, `dataProxima`, `responsavelRegistro`, `nomeVacina`, `ehVacinaCustomizada`, `tipoMedicamento`, `frequencia`, `nomeDoenca`, `ehDoencaCustomizada`, `resultado`.

**Additive fields**:

- `titulo String?`: display title for medication/treatment/procedure and optional title for other categories.
- `procedimento String?`: procedure or surgery name when `tipo = PROCEDIMENTO`.
- `medicamentoTratamento String?`: medication/treatment name when `tipo = MEDICAMENTO_TRATAMENTO`.
- `observacoes String?`: internal notes, never public.
- `profissionalClinica String?`: optional professional or clinic, never public.
- `criadoEm DateTime @default(now())`: useful for recent activity.
- `atualizadoEm DateTime @updatedAt`: useful for updates and ordering.

**Relationships**:

- Many `DocumentoSaude` optional links.
- Optional one-to-one originating `CuidadoPlanejado` completed into this record through `CuidadoPlanejado.registroRealizadoId`.
- Optional one-to-one planned next occurrence through `CuidadoPlanejado.origemRegistroSaudeId`.

**Validation**:

- `dataRegistro` cannot be future.
- `dataProxima`, when present, must be later than `dataRegistro`.
- `resultado` is required only where applicable and only `POSITIVO` or `NEGATIVO` for `TESTE_DOENCA`.
- Existing vaccine/parasite/test rules stay unchanged.
- CONSULTA is invalid for this model.

**Indexes**:

- Keep `idx_registro_saude_animal_id` and `idx_registro_saude_tipo`.
- Add `@@index([animalId, dataRegistro])` for per-animal timeline.
- Add `@@index([tipo, resultado])` for positive disease-test overview.

### CuidadoPlanejado

Single future care occurrence for an animal.

**Fields**:

- `id String @id @default(cuid())`
- `animalId String`
- `tipo TipoCuidadoPlanejado`
- `status StatusCuidadoPlanejado @default(PENDENTE)`
- `dataHoraPlanejada DateTime`
- `titulo String`
- `observacoes String?`
- `localProfissional String?`
- `origemRegistroSaudeId String? @unique`
- `registroRealizadoId String? @unique`
- `canceladoEm DateTime?`
- `concluidoEm DateTime?`
- `criadoEm DateTime @default(now())`
- `atualizadoEm DateTime @updatedAt`

**Relationships**:

- Belongs to one `Animal`.
- May originate from one `RegistroSaude` that has `dataProxima`.
- May point to one completed `RegistroSaude` when non-consultation care is performed.

**Validation and transitions**:

- Manual creation may use `CONSULTA`; generated/upserted planned care from `RegistroSaude.dataProxima` uses the same health category as the source record.
- `PENDENTE -> CONCLUIDO` or `PENDENTE -> CANCELADO` only.
- Reagendar updates `dataHoraPlanejada` on the same row.
- Completing a non-consultation row creates a `RegistroSaude` and sets `registroRealizadoId` atomically.
- Completing a `CONSULTA` sets `status = CONCLUIDO` and `concluidoEm` only.
- Completion must use a conditional update or equivalent transaction guard so the same row cannot complete twice.

**Indexes**:

- `@@index([animalId])`
- `@@index([status, dataHoraPlanejada])`
- `@@index([tipo, status, dataHoraPlanejada])`
- `@@index([origemRegistroSaudeId])` through unique constraint

### DocumentoSaude

Internal health document metadata.

**Fields**:

- `id String @id @default(cuid())`
- `animalId String`
- `registroSaudeId String?`
- `tipo TipoDocumentoSaude`
- `nomeArquivo String`
- `mimeType String`
- `tamanhoBytes Int`
- `urlArquivo String`
- `chaveArquivo String?`: provider key/custom id if available for deletion.
- `criadoEm DateTime @default(now())`

**Relationships**:

- Belongs to one `Animal`.
- Optionally belongs to one `RegistroSaude`.

**Validation**:

- Only owning ORGANIZACAO/ACOLHEDOR may upload/list/open/delete.
- MIME must be image or PDF.
- Max file size is 10 MB unless an existing stricter baseline applies.
- Public animal queries never select this model.
- If linked health record is deleted, document remains linked to animal and clears `registroSaudeId`; animal deletion cascades documents.

**Indexes**:

- `@@index([animalId, criadoEm])`
- `@@index([registroSaudeId])`

### ConversaAdocao

Private conversation for one approved/completed adoption request.

**Fields**:

- `id String @id @default(cuid())`
- `solicitacaoId String @unique`
- `status StatusConversaAdocao @default(ATIVA)`
- `criadaEm DateTime @default(now())`
- `arquivadaEm DateTime?`
- `atualizadaEm DateTime @updatedAt`

**Relationships**:

- Belongs to exactly one `SolicitacaoAdocao`.
- Has exactly two `ConversaParticipante` rows.
- Has many `MensagemAdocao` rows.

**Validation and transitions**:

- Created/released only when request transitions to `APROVADA`.
- `@@unique(solicitacaoId)` prevents duplicate conversation creation, including concurrent approval attempts.
- When request transitions to `CONCLUIDA`, status becomes `ARQUIVADA`; history remains readable by participants and sending is blocked.

**Indexes**:

- Unique `solicitacaoId`.
- `@@index([status, atualizadaEm])` for list filters.

### ConversaParticipante

Read/authorization row for each conversation participant.

**Fields**:

- `id String @id @default(cuid())`
- `conversaId String`
- `usuarioId String`
- `ultimaLeituraEm DateTime?`
- `criadoEm DateTime @default(now())`

**Relationships**:

- Belongs to one `ConversaAdocao`.
- Belongs to one `Usuario`.

**Validation**:

- Exactly two rows are created with the conversation: adopter user and responsible user from the animal owner.
- Only listed participants can list/open/send/read.

**Indexes/constraints**:

- `@@unique([conversaId, usuarioId])`
- `@@index([usuarioId])`

### MensagemAdocao

Immutable text message.

**Fields**:

- `id String @id @default(cuid())`
- `conversaId String`
- `autorUsuarioId String`
- `texto String`
- `criadaEm DateTime @default(now())`

**Relationships**:

- Belongs to one `ConversaAdocao`.
- Author is one `Usuario` who must be a participant.

**Validation**:

- Text is trimmed and cannot be empty.
- Text max length is 2,000 characters.
- No attachments, edits, or deletes in MVP.
- Sending requires active conversation and participant authorization.
- Render as plain text, never executable HTML.

**Indexes**:

- `@@index([conversaId, criadaEm])`
- `@@index([autorUsuarioId])`

## Migration Strategy

1. Add enum values and new models in `prisma/schema.prisma`.
2. Create a Prisma migration.
3. Backfill `CuidadoPlanejado` for existing `RegistroSaude` rows with non-null `dataProxima` using Prisma migration flow or a one-time script in the migration/seed process, preserving one row per source through `origemRegistroSaudeId @unique`.
4. Do not rewrite or delete existing health records.
5. Update `prisma/seed.ts` deletion order for new dependent models before deleting `SolicitacaoAdocao`, `RegistroSaude`, and `Animal`.

## Source-of-Truth Query Notes

- Responsible ownership filters use `Animal.organizacaoId` or `Animal.acolhedorId` in every health/dashboard query.
- Agenda status labels are derived at query/presenter boundary, not persisted.
- Recent activity uses existing timestamps from `Animal.criadoEm`, `RegistroSaude.criadoEm`, `SolicitacaoAdocao.dataSolicitacao`, approval/update timestamps, and adoption completion/update timestamps where sufficient. No generic audit entity is added.
