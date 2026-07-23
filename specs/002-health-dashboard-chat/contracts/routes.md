# Route Contracts: Health Operations Dashboard and Adoption Chat

Most business behavior uses Server Actions. Route Handlers remain limited to framework integrations and the required chat polling read.

## Dashboard Routes

### `GET /dashboard`

- **Actors**: ADOTANTE, ORGANIZACAO, ACOLHEDOR, ADMIN.
- **Responsible behavior**: Uses source-of-truth server aggregates for immediate attention dashboard.
- **Adopter/Admin behavior**: Existing dashboards preserved, with unread message indicator where applicable.
- **Access**: Authenticated active session.

### `GET /dashboard/saude`

- **Actors**: ORGANIZACAO, ACOLHEDOR.
- **Purpose**: Health overview for owned animals only.
- **Data**: overdue, today, next 7, next 30, animals without health history, positive tests.
- **Access**: Not available to visitors or ADOTANTE.

### `GET /dashboard/saude/agenda`

- **Actors**: ORGANIZACAO, ACOLHEDOR.
- **Query params**: `animalId`, `tipo`, `situacao`, `from`, `to`.
- **Purpose**: Chronological planned-care list with URL-serializable filters.
- **Access**: Owned animals only.

### `GET /dashboard/saude/documentos`

- **Actors**: ORGANIZACAO, ACOLHEDOR.
- **Query params**: `animalId`, `tipo`, `registroSaudeId` optional.
- **Purpose**: Internal document list and upload entry points.
- **Access**: Owned animals only; never public.

### `GET /dashboard/animais/[id]/saude`

- **Actors**: Owning ORGANIZACAO or ACOLHEDOR.
- **Purpose**: Per-animal health timeline and links/actions for documents and planned care.
- **Access**: Not found/denied for non-owner.

## Message Routes

### `GET /dashboard/mensagens`

- **Actors**: ADOTANTE, ORGANIZACAO, ACOLHEDOR.
- **Query params**: `status=ativas|arquivadas|todas`.
- **Purpose**: Conversation list with animal, counterparty, last message, timestamp, archived/active state, unread count.
- **Access**: Participant conversations only.

### `GET /dashboard/mensagens/[id]`

- **Actors**: Conversation participants.
- **Purpose**: Conversation detail; marks visible received messages as read through server action/page entry.
- **Access**: Participant only. ADMIN is not automatically allowed.

### `GET /api/mensagens/[id]` (required polling)

- **Actors**: Conversation participants.
- **Query params**: optional `after` ISO timestamp cursor.
- **Success**: Returns at most 100 messages newer than the cursor, in chronological order, as `{ messages, status }`. Each message contains `id`, `texto`, `criadaEm`, and `autorUsuarioId`.
- **Errors**: 400 invalid timestamp cursor, 401 unauthenticated/inactive, 403 unsupported role or non-participant. A conversation not visible to the actor is deliberately represented by 403, not distinguished as 404.
- **Constraint**: Read-only; no WebSocket.

## Upload Route

### `GET/POST /api/uploadthing`

- **Existing endpoint**: `animalPhoto` remains.
- **New endpoint**: `healthDocument`.
- **Input**: `animalId`, optional `registroSaudeId`, `tipoDocumento`.
- **Files**: image or PDF, max 10 MB.
- **Rules**: Middleware authorizes active responsible owner before upload; completion creates `DocumentoSaude` metadata. Public routes never expose document URLs.

## Public Routes

### `GET /animais/[id]`

- **Existing behavior preserved**: public animal profile and public health summary.
- **New privacy rule**: Does not select or render `DocumentoSaude`, `CuidadoPlanejado`, `observacoes`, `profissionalClinica`, or internal agenda data.
