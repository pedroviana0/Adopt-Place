# HTTP Contracts — Spec 009

Todas as rotas abaixo seguem `lib/api/responsible-http.ts`:

- `requireActiveResponsible()`, que chama `getServerSession()` antes de ler dados;
- erros no formato `{ error: { code, message, fieldErrors? } }`;
- status de erro via `actionErrorResponse`.

O frontend chama esses contratos pela camada `frontend/src/lib/data/*` (`apiRequest`). Em dev, o
acesso passa pelo proxy `/api` do Vite.

Códigos de erro novos, todos mapeados para **400** pelo default de `actionErrorResponse`:

| Código | Quando |
|---|---|
| `FOSTER_STATE_NOT_ALLOWED` | `situacaoLT ≠ NAO_SE_APLICA` ou `larTemporarioId` em animal de acolhedor, ou explícito com status final `ADOTADO` |
| `INVALID_FOSTER_LINK` | `larTemporarioId` com `situacaoLT ≠ EM_LT`, ou LT inexistente ou de outra ONG (sem distinguir) |

---

## 1. Animais gerenciados (alterados)

### `POST /api/animais/gerenciados` · `PATCH /api/animais/gerenciados/[id]`

O corpo atual (`animalInputSchema`, `.strict()`) ganha dois campos **opcionais**:

```jsonc
{
  // ...campos atuais (nome, especieId, racaId, porte, sexo, cor, idadeEstimada, castrado, descricao, status)
  "status": "EM_CUIDADOS" | "DISPONIVEL" | "EM_PROCESSO_ADOCAO" | "ADOTADO",   // sem RESGATADO
  "situacaoLT": "NAO_SE_APLICA" | "PROCURANDO" | "EM_LT",                     // opcional
  "larTemporarioId": "cuid" | null                                             // opcional
}
```

| Situação | Resposta |
|---|---|
| `status: "RESGATADO"` | 400 `VALIDATION_ERROR` (enum) |
| Campo de LT ausente no `PATCH` | mantém o valor atual |
| Campo de LT ausente no `POST` | `NAO_SE_APLICA` / `null` |
| Acolhedor com `situacaoLT ≠ NAO_SE_APLICA` ou `larTemporarioId ≠ null` | 400 `FOSTER_STATE_NOT_ALLOWED` |
| `status: "ADOTADO"` sem campos de LT | 200; o servidor grava `NAO_SE_APLICA` + `null` |
| `status: "ADOTADO"` com `situacaoLT ≠ NAO_SE_APLICA` ou `larTemporarioId ≠ null` | 400 `FOSTER_STATE_NOT_ALLOWED` |
| `situacaoLT` final `≠ EM_LT` e `larTemporarioId` omitido | 200; o servidor grava `larTemporarioId = null` |
| `larTemporarioId` não nulo com `situacaoLT ≠ EM_LT` explícito | 400 `INVALID_FOSTER_LINK` |
| `larTemporarioId` de outra ONG ou inexistente | 400 `INVALID_FOSTER_LINK` |
| Regras atuais (fotos, taxonomia, dono) | inalteradas |

### `GET /api/animais/gerenciados`

Query atual (`q`, `status`, `especieId`, `racaId`, `porte`, `sexo`) mais:

| Parâmetro | Valores | Efeito |
|---|---|---|
| `lt` | `NAO_SE_APLICA` · `PROCURANDO` · `EM_LT` · `EM_LT_SEM_VINCULO` | filtra por `situacaoLT`; `EM_LT_SEM_VINCULO` = `EM_LT` + `larTemporarioId: null` |
| `tratamento` | `1` | apenas animais "em tratamento" (não `ADOTADO` + `MEDICAMENTO_TRATAMENTO` `PENDENTE`) |

`lt` enviado por **acolhedor** → 400 `VALIDATION_ERROR`. Valor fora do enum → 400 (`.strict()`).

Cada item de `animals[]` ganha:

```jsonc
{
  "situacaoLT": "PROCURANDO",
  "larTemporario": { "id": "cuid", "nomeTutor": "Maria Souza" } | null,
  "emTratamento": true
}
```

### `GET /api/animais/gerenciados/[id]`

`animal` ganha os mesmos três campos.

---

## 2. Conclusão de adoção (efeito alterado, contrato igual)

### `POST /api/solicitacoes/gerenciadas/[id]`

A requisição e as respostas não mudam. Efeito novo: na mesma transação e no mesmo `updateMany` que
leva o animal de `EM_PROCESSO_ADOCAO` para `ADOTADO`, grava `situacaoLT = NAO_SE_APLICA` e
`larTemporarioId = null`.

---

## 3. Dashboard operacional (alterado)

### `GET /api/dashboard/operacional`

`indicators` ganha:

```jsonc
{
  "animalsInTreatment":          { "count": 1, "href": "/dashboard/animais?tratamento=1" },          // ONG e acolhedor
  "animalsSeekingFoster":        { "count": 3, "href": "/dashboard/animais?lt=PROCURANDO" },        // só ONG
  "animalsInFosterUnregistered": { "count": 2, "href": "/dashboard/animais?lt=EM_LT_SEM_VINCULO" }  // só ONG
}
```

- Para acolhedor, `animalsSeekingFoster` e `animalsInFosterUnregistered` são **omitidos**.
- `animalStatusCounts` perde a chave `RESGATADO`.
- Os demais campos não mudam.

---

## 4. Lares temporários (novos; só Organização)

Comum a todas as rotas desta seção:

- sem sessão → 401;
- conta inativa → 403 `INACTIVE_ACCOUNT`;
- perfil `ACOLHEDOR` → **403 `FORBIDDEN`**;
- LT inexistente **ou** de outra ONG → **404 `NOT_FOUND`**, sem distinção;
- `organizacaoId` sempre vem da sessão, nunca do corpo;
- nada destas rotas aparece em resposta pública ou de adotante.

### `GET /api/lares-temporarios`

```jsonc
200 { "laresTemporarios": [ {
  "id": "cuid", "nomeTutor": "Maria Souza", "telefone": "24999998888",
  "endereco": "Rua X, 10", "cidade": "Volta Redonda", "observacoes": null,
  "totalAnimais": 2, "criadoEm": "ISO", "atualizadoEm": "ISO"
} ] }
```

Ordem: `nomeTutor` crescente. Sem paginação. A busca por nome é feita no cliente.

### `POST /api/lares-temporarios`

```jsonc
{ "nomeTutor": "Maria Souza", "telefone": "(24) 99999-8888", "endereco": "Rua X, 10",
  "cidade": "Volta Redonda", "observacoes": "Aceita só gatos", "autorizacaoTutor": true }
```

| Situação | Resposta |
|---|---|
| Válido | 201 `{ "larTemporario": { "id": "cuid" } }` |
| `autorizacaoTutor` ausente ou `false` | 400 `VALIDATION_ERROR` (`fieldErrors.autorizacaoTutor`) |
| Campo inválido ou desconhecido | 400 `VALIDATION_ERROR` |

`autorizacaoTutor` não é persistido.

### `GET /api/lares-temporarios/[id]`

```jsonc
200 { "larTemporario": { /* LarTemporarioDTO */ "animais": [
  { "id": "cuid", "nome": "Seninha", "status": "DISPONIVEL", "fotoPrincipal": { "urlFoto": "…" } }
] } }
```

### `PATCH /api/lares-temporarios/[id]`

Os mesmos campos do `POST`, **sem** `autorizacaoTutor`, todos obrigatórios (substituição) e
`.strict()`. Resposta `200 { "success": true }`.

### `DELETE /api/lares-temporarios/[id]`

`200 { "success": true }`. Exclusão física. Os animais vinculados ficam `EM_LT` com
`larTemporarioId = null` (FK `ON DELETE SET NULL`).

### `GET /api/lares-temporarios/vinculaveis`

No App Router, o segmento estático `vinculaveis` tem precedência sobre `[id]`.

Animais da ONG com `situacaoLT = EM_LT` e `larTemporarioId = null`:

```jsonc
200 { "animais": [ { "id": "cuid", "nome": "Bob", "status": "EM_CUIDADOS", "fotoPrincipal": null } ] }
```

### `POST /api/lares-temporarios/[id]/animais`

```jsonc
{ "animalId": "cuid" }
```

| Situação | Resposta |
|---|---|
| LT da ONG e animal da ONG `EM_LT` sem vínculo | 200 `{ "success": true }` |
| LT de outra ONG ou inexistente | 404 `NOT_FOUND` |
| Animal de outra ONG, sem `EM_LT`, já vinculado ou inexistente | 409 `INVALID_TRANSITION` |

### `DELETE /api/lares-temporarios/[id]/animais/[animalId]`

| Situação | Resposta |
|---|---|
| Animal vinculado a este LT | 200; `larTemporarioId = null`, `situacaoLT` continua `EM_LT` |
| Não vinculado a este LT, ou LT/animal de outra ONG | 404 `NOT_FOUND` |

---

## 5. Saúde (contratos inalterados; nova tela os usa)

- `POST /api/animais/gerenciados/[id]/saude` com `tipoRegistro: "MEDICAMENTO_TRATAMENTO"`,
  `medicamentoTratamento`, `dataAplicacao` e `dataProxima?`. Já existe; o `TratamentoForm` passa a
  chamá-lo.
- `POST /api/saude/cuidados/[id]/concluir` com `tipoRegistro: "MEDICAMENTO_TRATAMENTO"` e
  `dataProxima?`. Já existe; o `CompletionForm` passa a enviar `dataProxima`.

---

## 6. Contratos que **não** podem mudar (RF-015)

Estas rotas não podem ganhar `situacaoLT`, `larTemporario`, `larTemporarioId` nem `emTratamento`:

- `GET /api/animais` (vitrine) e `GET /api/animais/[id]` (detalhe público);
- `GET /api/feels`;
- `GET /api/favoritos`;
- `GET /api/perfis/organizacao/[id]`, `GET /api/perfis/acolhedor/[id]` e `GET /api/perfis/adotante/[id]`;
- `GET /api/solicitacoes` (solicitações do adotante) e `GET /api/dashboard/adotante`;
- `GET /api/conversas`, `GET /api/conversas/[id]` e `GET /api/mensagens/[id]`.

O guarda é o teste `__tests__/queries/lt-privacy.test.ts`, que cobre as queries usadas por essas
rotas: `animal-showcase`, `public-animal`, `feels`, `favorites`, `public-profiles`,
`adopter-requests`, `adotante-dashboard` e `mensagens`.
