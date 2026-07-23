# Server Action Contracts: Health Operations Dashboard and Adoption Chat

All protected actions must call `getServerSession()` through existing guards or equivalent direct checks, reject inactive users, and authorize by owner/participant before selecting or mutating protected data. All inputs must be validated by Zod on the server.

## Health Records

### `createRegistroSaude(animalId, input)`

- **Actor**: Owning ORGANIZACAO or ACOLHEDOR.
- **Input**: Existing variants `VACINA`, `CONTROLE_PARASITAS`, `TESTE_DOENCA`; new variants `MEDICAMENTO_TRATAMENTO`, `PROCEDIMENTO`.
- **Success**: Creates completed health record. If `dataProxima` is provided, upserts exactly one pending `CuidadoPlanejado` linked by `origemRegistroSaudeId`.
- **Errors**: unauthenticated, inactive, wrong role, not owner, future completion date, next date not after completion date, invalid category fields.

### `updateRegistroSaude(recordId, input)`

- **Actor**: Owning ORGANIZACAO or ACOLHEDOR.
- **Success**: Updates completed health record and upserts/updates/removes linked planned care according to `dataProxima`.
- **Errors**: same as create; not found; not owner.

### `deleteRegistroSaude(recordId)`

- **Actor**: Owning ORGANIZACAO or ACOLHEDOR.
- **Success**: Deletes the record, clears optional document links, and removes/cancels pending planned care originated by the record if still pending.
- **Errors**: not owner, not found.

## Planned Care / Agenda

### `createConsultaPlanejada(input)`

- **Actor**: Owning ORGANIZACAO or ACOLHEDOR.
- **Input**: `animalId`, `dataHoraPlanejada`, `titulo`, optional `observacoes`, optional `localProfissional`.
- **Success**: Creates one `CONSULTA` planned-care event with `PENDENTE` status.
- **Errors**: not owner, invalid date/title, wrong role.

### `rescheduleCuidadoPlanejado(cuidadoId, input)`

- **Actor**: Owning ORGANIZACAO or ACOLHEDOR.
- **Input**: new `dataHoraPlanejada`, optional title/details when editable.
- **Success**: Updates the same planned-care row; no duplicate alert is created.
- **Errors**: not owner, not found, already completed/cancelled, invalid date.

### `cancelCuidadoPlanejado(cuidadoId, { confirmado: true })`

- **Actor**: Owning ORGANIZACAO or ACOLHEDOR.
- **Input**: Literal confirmation payload `{ confirmado: true }`, validated again on the server.
- **Success**: Sets `status = CANCELADO` and `canceladoEm`.
- **Errors**: not owner, not found, already completed/cancelled.

### `completeCuidadoPlanejado(cuidadoId, input)`

- **Actor**: Owning ORGANIZACAO or ACOLHEDOR.
- **Input**: actual completion data for non-CONSULTA; no health-record payload for CONSULTA.
- **Success**: In one transaction, conditionally claims a `PENDENTE` row, creates the corresponding `RegistroSaude` for non-CONSULTA, links `registroRealizadoId`, sets `CONCLUIDO` and `concluidoEm`. CONSULTA only sets `CONCLUIDO` and `concluidoEm`.
- **Errors**: not owner, not found, already completed/cancelled, validation error. Double completion attempts must return an error and not create a second record.

Every action in this contract resolves to `{ success?: boolean; error?: string }`.
For `completeCuidadoPlanejado`, `input` is omitted only when the persisted planned
care type is `CONSULTA`; every other type requires the matching health-record payload.

## Health Documents

### `deleteDocumentoSaude(documentoId)`

- **Actor**: Owning ORGANIZACAO or ACOLHEDOR.
- **Success**: Deletes metadata and attempts provider file deletion when `chaveArquivo` is available; returns success for metadata deletion even if provider deletion capability is unavailable, with server-side logging only if existing logging exists.
- **Errors**: not owner, not found.

Document creation is handled by Uploadthing `healthDocument` completion after upload middleware authorizes ownership and file constraints.

## Adoption Requests / Chat Release

### `decideAdoptionRequest(solicitacaoId, input)`

- **Actor**: Owning ORGANIZACAO or ACOLHEDOR.
- **Approval success**: Existing behavior remains: selected request becomes `APROVADA`, animal becomes `EM_PROCESSO_ADOCAO`, competing in-analysis requests become `RECUSADA`. In the same transaction, upsert one `ConversaAdocao` for the selected request and create the two participant rows if missing.
- **Refusal success**: Existing behavior remains: selected request becomes `RECUSADA`; no conversation is created or released.
- **Errors**: existing errors plus duplicate conversation attempts resolved by `@@unique(solicitacaoId)`/upsert.

### `completeAdoption(solicitacaoId)`

- **Actor**: Owning ORGANIZACAO or ACOLHEDOR.
- **Success**: Existing behavior remains: request becomes `CONCLUIDA`, animal becomes `ADOTADO`. In the same transaction, related conversation becomes `ARQUIVADA` and read-only.
- **Errors**: not owner, request not approved.

## Messages

### `sendMensagem(conversaId, input)`

- **Actor**: Conversation participant only.
- **Input**: `texto` string, trimmed, 1..2,000 characters.
- **Success**: Creates immutable message with server timestamp and author user id; updates conversation timestamp.
- **Errors**: unauthenticated, inactive, not participant, archived conversation, empty text, over limit.

### `markConversationRead(conversaId)`

- **Actor**: Conversation participant only.
- **Success**: Sets participant `ultimaLeituraEm` to server now for visible received messages.
- **Errors**: unauthenticated, inactive, not participant.
