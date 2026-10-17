# Data Model — Spec 009: Lar temporário e reforma do status

**Fonte da verdade:** `prisma/schema.prisma` (constituição, princípio II). Este documento descreve a
mudança; o schema é editado na implementação.

---

## 1. Mudanças em `prisma/schema.prisma`

### 1.1 `StatusAnimal` (alterado)

```prisma
enum StatusAnimal {
  EM_CUIDADOS          // significado novo: "ainda não anunciado" (D2)
  DISPONIVEL
  EM_PROCESSO_ADOCAO
  ADOTADO
}
```

- `RESGATADO` sai (D1). As linhas existentes são convertidas para `EM_CUIDADOS` na migration 1.
- O rótulo "Em cuidados" se mantém; o significado muda (C13).

### 1.2 `SituacaoLT` (novo)

```prisma
enum SituacaoLT {
  NAO_SE_APLICA   // "Não precisa" (padrão)
  PROCURANDO      // "Procurando LT"
  EM_LT           // "Em LT"
}
```

### 1.3 `Animal` (alterado)

```prisma
model Animal {
  // ...campos atuais inalterados
  status          StatusAnimal   @default(EM_CUIDADOS)   // era @default(RESGATADO)
  situacaoLT      SituacaoLT     @default(NAO_SE_APLICA)
  larTemporarioId String?
  larTemporario   LarTemporario? @relation(fields: [larTemporarioId], references: [id], onDelete: SetNull)

  // índices atuais mantidos
  @@index([larTemporarioId], map: "idx_animal_lar_temporario_id")
}
```

### 1.4 `LarTemporario` (novo)

```prisma
model LarTemporario {
  id            String      @id @default(cuid())
  organizacaoId String
  organizacao   Organizacao @relation(fields: [organizacaoId], references: [id], onDelete: Cascade)
  nomeTutor     String
  telefone      String      // só dígitos (phoneSchema)
  endereco      String
  cidade        String
  observacoes   String?
  criadoEm      DateTime    @default(now())
  atualizadoEm  DateTime    @default(now()) @updatedAt
  animais       Animal[]

  @@index([organizacaoId], map: "idx_lar_temporario_organizacao_id")
}
```

### 1.5 `Organizacao` (alterado: só a relação inversa)

```prisma
  laresTemporarios LarTemporario[]
```

`AcolhedorIndependente` **não** ganha relação (D6).

---

## 2. Validação

### 2.1 `LarTemporario`: schemas de entrada (servidor `lib/schemas/lar-temporario.ts`; cliente `frontend/src/lib/schemas/larTemporario.ts`)

| Campo | Regra | Origem |
|---|---|---|
| `nomeTutor` | `personNameSchema`: de 3 a 120 caracteres, ao menos 2 letras, sem dígitos | RF-022a |
| `telefone` | `phoneSchema`: DDD + 8 ou 9 dígitos, transformado em só dígitos | RF-022a |
| `endereco` | `addressSchema`: de 3 a 200 caracteres | RF-022a |
| `cidade` | texto obrigatório com `trim`, de 2 a 80 caracteres | RF-022a |
| `observacoes` | `optionalTextSchema`, até 1.000 caracteres; vazio vira `null` | RF-022a |
| `autorizacaoTutor` | `z.literal(true)`, **só no create**; nunca persistido | C3, RF-022 |

O create e o update são `.strict()`. `organizacaoId` **nunca** vem do corpo: vem do contexto da sessão.

### 2.2 `Animal`: acréscimo ao `animalInputSchema` (servidor e cliente)

| Campo | Regra |
|---|---|
| `situacaoLT` | `z.nativeEnum(SituacaoLT).optional()` |
| `larTemporarioId` | `idSchema.nullable().optional()` |

O schema estático não conhece perfil nem estado atual. As regras condicionais ficam em
`resolveFosterState` (research R4).

### 2.3 Invariantes (backend; sem `CHECK` no banco, conforme research R2)

| # | Invariante | Onde é garantida |
|---|---|---|
| I1 | `larTemporarioId ≠ null ⇒ situacaoLT = EM_LT` | `resolveFosterState`; vincular exige `EM_LT` no `where` |
| I2 | `situacaoLT ≠ NAO_SE_APLICA ⇒ organizacaoId ≠ null` | `resolveFosterState` |
| I3 | `situacaoLT ≠ NAO_SE_APLICA ⇒ status ∈ {EM_CUIDADOS, DISPONIVEL, EM_PROCESSO_ADOCAO}` | `resolveFosterState` mais o reset nos três caminhos até `ADOTADO` |
| I4 | `larTemporario.organizacaoId = animal.organizacaoId` | `resolveFosterState` (passo 5); vincular filtra pelos dois `organizacaoId` |
| I5 | O LT só é lido ou escrito pela ONG dona | `where: { organizacaoId: context.responsavelId }` em toda query de LT |

---

## 3. Transições

### 3.1 `Animal.status` (sem mudança de regra, só sem `RESGATADO`)

```
EM_CUIDADOS ──(≥2 fotos)──▶ DISPONIVEL ──(aprovação)──▶ EM_PROCESSO_ADOCAO ──(conclusão)──▶ ADOTADO
      ▲                         │
      └──── edição manual ──────┘   (o select manual continua aceitando qualquer status; C7)
```

### 3.2 `Animal.situacaoLT`

```
NAO_SE_APLICA ◀──▶ PROCURANDO ◀──▶ EM_LT [larTemporarioId: null | LT da ONG]
        ▲                               │
        └──── status vira ADOTADO ──────┘   (reset automático: NAO_SE_APLICA + null)
```

| Evento | Efeito em `situacaoLT` / `larTemporarioId` | Requisito |
|---|---|---|
| Edição com campo ausente | mantém | RF-013a |
| `situacaoLT`: `EM_LT` → outro | `larTemporarioId = null` | RF-012 |
| Status vira `ADOTADO` (conclusão, `updateAnimal` sem campos de LT, `updateAnimalStatus`) | `NAO_SE_APLICA` + `null` | RF-013 |
| Vincular pela aba | `larTemporarioId = ltId`; exige `EM_LT` e `null` antes | RF-024 |
| Desvincular pela aba | `larTemporarioId = null`; `situacaoLT` continua `EM_LT` | RF-023 |
| Excluir LT | FK `SET NULL`: os animais ficam `EM_LT` sem registro | RF-025 |
| Animal excluído | nada no LT (a FK está do lado do animal) | — |
| Conta da ONG desativada | nada | C6 |

### 3.3 "Em tratamento" (derivado, sem coluna)

```
emTratamento(animal) =
  animal.status ≠ ADOTADO
  ∧ ∃ CuidadoPlanejado c : c.animalId = animal.id
                         ∧ c.tipo = MEDICAMENTO_TRATAMENTO
                         ∧ c.status = PENDENTE        // qualquer data, inclusive atrasada
```

Liga quando um registro ou conclusão de `MEDICAMENTO_TRATAMENTO` informa a próxima dose
(`syncPlannedCare` / `createNextCare`). Desliga quando o último cuidado pendente é concluído sem
próxima dose ou é cancelado, ou quando o animal vira `ADOTADO`.

---

## 4. DTOs alterados (gestão; só a ONG ou o acolhedor dono)

```ts
// toOwnedAnimalDTO: campos novos
situacaoLT: "NAO_SE_APLICA" | "PROCURANDO" | "EM_LT";
larTemporario: { id: string; nomeTutor: string } | null;
emTratamento: boolean;
```

Para acolhedor: `situacaoLT` sempre `NAO_SE_APLICA`, `larTemporario` sempre `null` (por I2).

```ts
// LarTemporarioDTO (lista)
{ id, nomeTutor, telefone, endereco, cidade, observacoes, totalAnimais: number,
  criadoEm: string, atualizadoEm: string }

// LarTemporarioDetailDTO
LarTemporarioDTO & { animais: { id, nome, status, fotoPrincipal: { urlFoto } | null }[] }
```

**Nenhum DTO público ou de adotante muda** (RF-015).

---

## 5. Volume

São dezenas de animais e de LTs por ONG, numa região só (Volta Redonda). Não há paginação na lista de
LTs (research R9). As contagens do dashboard são `count` com `EXISTS` coberto pelos índices
existentes de `CuidadoPlanejado`.

---

## 6. Seed (RF-027)

- `clearTestData`: acrescentar `prisma.larTemporario.deleteMany()` **antes** de
  `prisma.organizacao.deleteMany()`.
- Dois LTs fictícios da `organizacao.teste@example.com`, localizada pelo e-mail do usuário, não pela
  ordem de CNPJ.
- Animais de ONG (os 36 atuais): `situacaoLT` pelo índice `i % 3` (`0` → `NAO_SE_APLICA`,
  `1` → `PROCURANDO`, `2` → `EM_LT`). O período 3 não se alinha com espécie (2), sexo (4) nem
  responsável (16), conforme o §11 do `CLAUDE.md`. Entre os `EM_LT` da `organizacao.teste`, o vínculo
  roda LT1 → LT2 → sem registro. Os animais de acolhedor ficam `NAO_SE_APLICA`.
- **Seninha** (animal 37): gata, `organizacao.teste`, `DISPONIVEL`, 2 fotos, `PROCURANDO`, com um
  `RegistroSaude` `MEDICAMENTO_TRATAMENTO` ("Antibiótico") de hoje e o `CuidadoPlanejado` `PENDENTE`
  originado dele, com a próxima dose daqui a 2 dias.
- O seed **não** usa `RESGATADO` hoje; nada a converter.
- **Onde roda:** só no branch Neon descartável `seed-009`, via `npx prisma migrate reset --force`
  (`quickstart.md` §5). Nunca no `dev-009` nem na produção, porque o `clearTestData` apaga tudo.

---

## 7. Glossário: rótulo de UI × código

| Rótulo na interface | Código / contrato |
|---|---|
| "Não precisa" | `SituacaoLT.NAO_SE_APLICA` |
| "Procurando LT" | `SituacaoLT.PROCURANDO`; filtro `lt=PROCURANDO`; indicador `animalsSeekingFoster` |
| "Em LT · <nome do tutor>" | `SituacaoLT.EM_LT` com `larTemporarioId` preenchido |
| "Em LT · sem registro" / card "Em LT sem registro" | `SituacaoLT.EM_LT` com `larTemporarioId = null`; filtro **`lt=EM_LT_SEM_VINCULO`**; indicador `animalsInFosterUnregistered` |
| "Em tratamento" | derivado `emTratamento` / `inTreatmentWhere`; filtro `tratamento=1`; indicador `animalsInTreatment` |
| "Em cuidados" | `StatusAnimal.EM_CUIDADOS`, que significa "ainda não anunciado" |

"Sem registro" (UI) e "sem vínculo" (código) são **o mesmo estado**: o rótulo fala com a ONG, o código
descreve a coluna.
