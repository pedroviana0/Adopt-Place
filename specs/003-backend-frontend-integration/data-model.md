# Data Model and DTO Boundaries: Backend Frontend Integration

This feature does not introduce new persisted entities during planning. The Prisma schema in `prisma/schema.prisma` remains the source of truth. Any later schema change must be proven by the audit and tested in homologation before migration against an original database.

## Existing Source-of-Truth Entities

- **Usuario**: account, e-mail, password hash, profile type, active status, NextAuth accounts/sessions, conversation participation and authored messages.
- **Adotante**: adopter profile, CPF, contact/address fields, standardized screening fields, screening completion flag, favorites and adoption requests.
- **Organizacao**: organization responsible profile, CNPJ, contact/address fields, responsible person, capacity and owned animals.
- **AcolhedorIndependente**: independent foster profile, CPF, contact/address fields, capacity and owned animals.
- **Especie/Raca**: animal taxonomy and filter options.
- **Animal**: lifecycle status, public attributes, responsible owner, photos, health records, planned care, documents, requests, favorites and relationships.
- **FotoAnimal**: animal photos, primary flag, order and creation time.
- **AnimalRelacionado**: bidirectional relationship represented by paired rows.
- **RegistroSaude**: completed clinical facts only: VACINA, CONTROLE_PARASITAS, TESTE_DOENCA, MEDICAMENTO_TRATAMENTO, PROCEDIMENTO.
- **CuidadoPlanejado**: operational planned care and CONSULTA agenda items.
- **DocumentoSaude**: internal health documents linked to an animal and optionally a health record.
- **Favorito**: adopter-to-animal saved relationship.
- **SolicitacaoAdocao**: adoption request and state transitions.
- **ConversaAdocao / ConversaParticipante / MensagemAdocao**: approved-adoption conversation, participants/read state and immutable text messages.

## DTO Principles

- DTOs are frontend-facing allowlists, not Prisma model exports.
- Public DTOs exclude CPF, CNPJ, phone, e-mail, full address, screening answers, private request data, health documents, internal health notes, clinic/professional details and chat data.
- Protected DTOs include only fields needed by the authenticated role and must be selected after authorization.
- DTO field names should be mapped deliberately to the existing frontend domain concepts in `frontend/src/lib/domain/types.ts`, but the backend remains authoritative when conflicts exist.
- Date fields crossing HTTP boundaries should be serialized consistently as ISO strings unless a later contract states otherwise.

## DTO Groups to Define in Contract Issues

- **SessionDTO**: safe user id, e-mail, role, active state, display name and scoped profile ids.
- **PublicAnimalSummaryDTO**: vitrine card data, primary photo, public responsible display, tags and filter-safe values.
- **PublicAnimalDetailDTO**: public animal detail, gallery, public health summary and related public animals without private fields.
- **ProfileDTOs**: adopter, organization and foster editable/read-only fields with CPF/CNPJ immutable.
- **ScreeningDTO**: adopter-owned editable screening and responsible-user read-only request review shape.
- **FavoriteDTO**: adopter favorite status and favorite list item.
- **AdoptionRequestDTOs**: adopter request list, owner request list/detail, decision result and completion result.
- **OwnedAnimalDTOs**: responsible-user animal list/detail, management fields, photo and relationship shapes.
- **HealthDTOs**: health records, planned care, agenda items, overview, timeline and document metadata.
- **DashboardDTOs**: adopter, responsible and admin dashboard summaries from real source data.
- **ChatDTOs**: conversation list/detail, message list, unread count and archived state.
- **AdminUserDTO**: user list and active/inactive mutation result without password hash.

## State Transitions to Preserve

- Animal: RESGATADO, EM_CUIDADOS, DISPONIVEL, EM_PROCESSO_ADOCAO, ADOTADO.
- Adoption request: EM_ANALISE, APROVADA, RECUSADA, CONCLUIDA.
- Approval moves the selected request to APROVADA, moves the animal to EM_PROCESSO_ADOCAO, refuses competing EM_ANALISE requests and releases one chat conversation.
- Completion moves request to CONCLUIDA, animal to ADOTADO and chat to read-only archived state.
- CONSULTA remains an operational planned-care item and never becomes RegistroSaude history.

## Known Schema-Audit Items

- `frontend/INTEGRATION.md` references organization/foster `fotoUrl`; before implementation, confirm whether the current schema and migrations contain those fields or record a homologation-gated schema gap.
- `frontend/src/lib/domain/enums.ts` currently lists only three health record types, while the backend schema includes feature 002 additions. DTO alignment must be audited before health/dashboard/chat frontend work.
