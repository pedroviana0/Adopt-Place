# Front-End Integration Contract: Lovable

This contract defines the data shapes, operations, filters, states, errors, and authorization rules needed by the front-end. Names are product contracts; implementation may use Server Actions, server queries, or a polling route as planned.

## Shared Rules

- All protected data requires active session.
- ORGANIZACAO and ACOLHEDOR see only animals and requests they own.
- ADOTANTE sees only their own conversations and adoption requests.
- ADMIN does not read adoption conversations automatically.
- Dates are server-provided ISO strings and grouped by application timezone.
- User-provided message text must render as plain text, never HTML.

## Operational Dashboard

### Data Shape

```ts
type OperationalDashboard = {
  indicators: {
    availableAnimals: { count: number; href: string };
    animalsInCare: { count: number; href: string };
    animalsInAdoptionProcess: { count: number; href: string };
    requestsWaitingReview: { count: number; href: string };
    overdueHealthCare: { count: number; href: string };
    next7DaysHealthCare: { count: number; href: string };
  };
  priorityItems: Array<{
    id: string;
    kind: "SAUDE_ATRASADA" | "SAUDE_HOJE" | "SOLICITACAO_ANALISE" | "ADOCAO_APROVADA_CONCLUSAO";
    title: string;
    subtitle: string;
    dueAt?: string;
    href: string;
  }>;
  adoptionFunnel: { inAnalysis: number; approvedOrInProcess: number; completedInPeriod: number };
  animalStatusCounts: Record<"RESGATADO" | "EM_CUIDADOS" | "DISPONIVEL" | "EM_PROCESSO_ADOCAO" | "ADOTADO", number>;
  recentActivity: Array<{ id: string; kind: string; label: string; occurredAt: string; href?: string }>;
  unreadMessages: number;
};
```

### States

- Loading: skeletons for indicators and priority list.
- Empty: no animals/requests/care; show first-step actions.
- Error: recoverable message and retry/navigation action.

### URL Filters

- Requests waiting review: `/dashboard/solicitacoes?status=EM_ANALISE`
- Overdue care: `/dashboard/saude/agenda?situacao=ATRASADO`
- Next 7 days care: `/dashboard/saude/agenda?situacao=PROXIMOS_7_DIAS`
- Animal status: `/dashboard/animais?status=DISPONIVEL` etc.

## Health Overview

```ts
type HealthOverview = {
  groups: {
    overdue: HealthAgendaItem[];
    today: HealthAgendaItem[];
    next7Days: HealthAgendaItem[];
    next30Days: HealthAgendaItem[];
  };
  animalsWithoutHistory: Array<{ id: string; nome: string; href: string }>;
  positiveTests: Array<{ animalId: string; animalNome: string; disease: string; recordedAt: string; href: string }>;
};
```

## Health Agenda

```ts
type HealthAgendaFilter = {
  animalId?: string;
  tipo?: "VACINA" | "CONTROLE_PARASITAS" | "TESTE_DOENCA" | "MEDICAMENTO_TRATAMENTO" | "PROCEDIMENTO" | "CONSULTA";
  situacao?: "ATRASADO" | "HOJE" | "PROXIMO" | "CONCLUIDO" | "CANCELADO" | "PROXIMOS_7_DIAS" | "PROXIMOS_30_DIAS";
  from?: string;
  to?: string;
};

type HealthAgendaItem = {
  id: string;
  animalId: string;
  animal: { id: string; nome: string };
  animalHref: string;
  tipo: HealthAgendaFilter["tipo"];
  status: "PENDENTE" | "CONCLUIDO" | "CANCELADO";
  situacao: "ATRASADO" | "HOJE" | "PROXIMO" | "CONCLUIDO" | "CANCELADO";
  dataHoraPlanejada: string;
  titulo: string;
  observacoes: string | null;
  localProfissional: string | null;
  origemRegistroSaudeId: string | null;
};
```

`canComplete`, `canReschedule` and `canCancel` are derived by the interface from
`status === "PENDENTE"`; they are not persisted or returned as source data.

### Operations

- Open animal: navigate to item `animal.href`.
- Complete: opens category-specific form. CONSULTA completion has no health-history form.
- Reschedule: requires new date/time and updates same item.
- Cancel/discard: requires confirmation.

### Errors

- `Acesso negado`
- `Cuidado nao encontrado`
- `Cuidado ja concluido ou cancelado`
- `Data invalida`
- Category-specific health validation errors.

## Health Documents

```ts
type HealthDocument = {
  id: string;
  animalId: string;
  animal: { id: string; nome: string; href: string };
  registroSaudeId: string | null;
  registroSaude: {
    id: string;
    tipo: "VACINA" | "CONTROLE_PARASITAS" | "TESTE_DOENCA" | "MEDICAMENTO_TRATAMENTO" | "PROCEDIMENTO";
    titulo: string | null;
    dataRegistro: string;
  } | null;
  tipo: "EXAME" | "RECEITA" | "LAUDO" | "COMPROVANTE_VACINACAO" | "OUTRO";
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  criadoEm: string;
  openHref: string;
};
```

### Upload Rules

- Accepted: image MIME types and PDF.
- Max size: 10 MB per file unless existing stricter limit is applied.
- Required metadata: animal, document type.
- Optional metadata: health record.
- Invalid type/size: reject with clear message and no document metadata.

### Privacy

- No document shape appears in public animal data.
- Document URLs are not included in public pages or adopter-facing views.

## Adoption Chat

```ts
type ConversationListItem = {
  id: string;
  requestId: string;
  animal: { id: string; nome: string; href: string };
  counterparty: { label: string };
  lastMessage?: { textPreview: string; sentAt: string; authorIsMe: boolean };
  status: "ATIVA" | "ARQUIVADA";
  unreadCount: number;
  href: string;
  updatedAt: string;
};

type ConversationDetail = {
  id: string;
  requestId: string;
  animal: { id: string; nome: string; href: string };
  counterparty: { label: string };
  status: "ATIVA" | "ARQUIVADA";
  messages: Array<{
    id: string;
    authorIsMe: boolean;
    text: string;
    sentAt: string;
  }>;
  canSend: boolean;
};
```

### Filters

- `/dashboard/mensagens?status=ativas`
- `/dashboard/mensagens?status=arquivadas`

### Operations

- `Abrir conversa` appears on approved request detail for authorized participants.
- Send text only when active.
- Open conversation marks visible received messages as read.
- Poll latest messages periodically through server-compatible refresh.

### Errors

- `Conversa nao encontrada`
- `Acesso negado`
- `Conversa arquivada`
- `Mensagem nao pode ser vazia`
- `Mensagem deve ter no maximo 2000 caracteres`

## Authorization Matrix

| Capability | Visitor | ADOTANTE | ORGANIZACAO/ACOLHEDOR | ADMIN |
|------------|---------|----------|------------------------|-------|
| Public animal health summary | Yes | Yes | Yes | Yes |
| Health center | No | No | Own animals only | No |
| Health documents | No | No | Own animals only | No |
| Operational dashboard | No | No | Own data only | Existing admin only |
| Conversation list/detail | No | Participant only | Participant only | No automatic access |
| Send chat message | No | Active participant | Active participant | No |
