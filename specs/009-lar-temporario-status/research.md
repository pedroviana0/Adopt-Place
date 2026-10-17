# Research — Spec 009: Lar temporário e reforma do status

**Data:** 2026-10-14 · **Spec:** [`spec.md`](spec.md) · **Plano:** [`plan.md`](plan.md)

Cada item segue o formato *Decisão / Motivo / Alternativas*. Os fatos citados foram lidos no código
da `main` (`95f54d1`) em 2026-10-14.

---

## R1 — Remover `RESGATADO` do enum no PostgreSQL

**Fato.** O PostgreSQL não tem `ALTER TYPE … DROP VALUE`. Para tirar um valor de enum, o Prisma gera
a troca de tipo: cria `StatusAnimal_new`, converte a coluna com `USING status::text::"StatusAnimal_new"`,
renomeia e remove o antigo, tudo entre `BEGIN; … COMMIT;`. O `ALTER COLUMN … TYPE` **falha** se
alguma linha ainda tiver `RESGATADO`: o Prisma avisa e não converte dados. `StatusAnimal` só é usado em
`Animal.status` (migration `20260531234000_init`, linhas 11 e 143). `idx_animal_status` é reconstruído
pelo próprio `ALTER COLUMN TYPE`.

**Decisão.** Gerar o SQL com `prisma migrate diff`, **offline**:
`--from-schema-datamodel` (schema da `main`, extraído com `git show`) e `--to-schema-datamodel
prisma/schema.prisma --script`. Gravar o resultado em `prisma/migrations/<ts>_status_sem_resgatado/migration.sql`
e acrescentar à mão **uma** linha logo depois do `BEGIN;`:

```sql
UPDATE "Animal" SET "status" = 'EM_CUIDADOS' WHERE "status" = 'RESGATADO';
```

Ordem final dentro da transação: `UPDATE` → `CREATE TYPE "StatusAnimal_new"` → `DROP DEFAULT` →
`ALTER COLUMN TYPE … USING` → `RENAME` antigo para `_old` → `RENAME` novo → `DROP TYPE _old` →
`SET DEFAULT 'EM_CUIDADOS'`. Se qualquer passo falha, a transação desfaz tudo e a tabela fica como
estava.

**Motivo.**
- `migrate diff` entre dois schemas não precisa de shadow database. `migrate dev` precisaria de uma, o
  que no Neon significa criar banco extra só para isso.
- O `UPDATE` dentro de uma migration Prisma tem precedente: a 006 fez backfill de
  `razaoSocialNormalizada` na migration `20260811210000_perfis_publicos`. O princípio II da
  constituição proíbe SQL em código de aplicação e migration **fora** do Prisma; aqui o SQL vive na
  migration versionada que o próprio Prisma aplica.
- Lock: o `ALTER COLUMN TYPE` reescreve a tabela com `ACCESS EXCLUSIVE`. Com dezenas de linhas, dura
  milissegundos.

**Alternativas rejeitadas.**
- *Script Prisma Client com `updateMany` antes da migration:* exige um passo operacional a mais, fora
  da transação, e pode ser esquecido.
- *Manter `RESGATADO` no enum e só escondê-lo na UI:* contradiz D1 e deixa um valor morto que a API
  continua aceitando.
- *`migrate dev --create-only`:* precisa de shadow database.

**Irreversibilidade.** Depois do `UPDATE`, não há como saber quais animais eram `RESGATADO`. Isso é
aceito (C10). A proteção é o backup descrito em R3.

---

## R2 — Migration do lar temporário

**Decisão.** A segunda migration (`<ts>_lar_temporario`, timestamp **posterior** ao de R1) é gerada
pelo `migrate diff` **sem edição manual**:

- `CREATE TYPE "SituacaoLT"`;
- `ADD COLUMN "situacaoLT" "SituacaoLT" NOT NULL DEFAULT 'NAO_SE_APLICA'` (no PostgreSQL 11+, default
  constante não reescreve a tabela);
- `ADD COLUMN "larTemporarioId" TEXT`;
- `CREATE TABLE "LarTemporario"`;
- dois índices;
- FK `Animal.larTemporarioId` com `ON DELETE SET NULL`;
- FK `LarTemporario.organizacaoId` com `ON DELETE CASCADE`.

**Invariantes sem `CHECK` no banco.** As regras `larTemporarioId ≠ null ⇒ situacaoLT = EM_LT` e "LT da
mesma ONG" ficam no backend (R4).

**Motivo.** O Prisma não modela `CHECK`. Criá-lo à mão abriria uma diferença permanente entre schema e
banco, invisível ao `schema.prisma`, que é a fonte da verdade (princípio II). O backend é o único
escritor, e os testes do R10 cobrem as invariantes.

**Alternativas rejeitadas.**
- *`CHECK` constraint manual:* rejeitada pelo motivo acima.
- *Trigger:* lógica de negócio no banco, contra o princípio III.

---

## R3 — Ensaio no Neon e ordem de virada

**Fato.** O build da Vercel roda só `prisma generate` (`postinstall`). O `migrate deploy` é manual
(`DEPLOY.md`). O Neon cria **branches** instantâneos a partir da produção, com cópia dos dados.

**Decisão.**
1. O Pedro cria o branch `validacao-009` a partir da produção e aponta `DATABASE_URL` para ele no
   próprio terminal. A IA não manuseia a URL.
2. Leitura prévia no console SQL do Neon: `SELECT status, count(*) FROM "Animal" GROUP BY status;`.
   É só leitura, não é código da aplicação.
3. `npx prisma migrate deploy`.
4. `npx prisma migrate status` e `npx prisma migrate diff --from-url "$env:DATABASE_URL"
   --to-schema-datamodel prisma/schema.prisma --exit-code`. Saída `0` significa schema sem drift.
5. `npx tsx scripts/verify-009-migration.ts`: verificador **read-only** com Prisma Client, no padrão
   do `scripts/verify-razao-social-normalizada.ts` da 006 (detalhe no quickstart).
6. Homologação da aplicação local contra o branch (quickstart §3).
7. Produção:
   1. o Pedro cria o branch de backup `pre-009`;
   2. aplica `migrate deploy` na produção;
   3. roda o verificador;
   4. só então faz o merge do PR, e a Vercel publica o código novo.

**Rollback.**
- Antes do merge: restaurar a produção a partir de `pre-009`. A `main` ainda roda o código antigo,
  compatível com o banco antigo.
- Depois do merge: reverter o merge e restaurar `pre-009`, perdendo o que for escrito no intervalo.
  Por isso o intervalo entre `migrate deploy` e merge deve ser curto e homologado.

**Janela de convivência.** O código antigo roda sobre o banco novo entre o passo 7.2 e o 7.4. Ele lê
normalmente: não sobra linha `RESGATADO`, e a coluna nova tem default. Salvar "Resgatado" no
formulário antigo falha; isso foi aceito na Clarification 2.

---

## R4 — Onde mora a regra de LT (e os três caminhos até `ADOTADO`)

**Fato.** Três funções gravam `Animal.status`:

| Caminho | Arquivo | Chamado por |
|---|---|---|
| `completeAdoption` | `lib/actions/solicitacoes.ts:240` (`tx.animal.updateMany` → `ADOTADO`) | `POST /api/solicitacoes/gerenciadas/[id]` |
| `updateAnimal` | `lib/actions/animais.ts:143` (`data: parsed.data`) | `PATCH /api/animais/gerenciados/[id]` |
| `updateAnimalStatus` | `lib/actions/animais.ts:201` | **nenhuma rota**; só testes (`animais.test.ts`, `animal-publication.test.ts`) |

A rota de conclusão **chama** a action, então aqui não há a duplicação descrita no §9.1 do
`CLAUDE.md`. `updateAnimalStatus` é código sem uso em produção, mas exportado e testado. Seguindo o
§9.1, a regra entra nas três funções.

**Decisão.** Criar o módulo server-only `lib/lar-temporario.ts` com duas funções puras e uma consulta:

- `resolveFosterState(atual, entrada, contexto)`: recebe o estado atual do animal (`status`,
  `situacaoLT`, `larTemporarioId`, `organizacaoId`) e a entrada **já parseada**, e devolve o
  `{ situacaoLT, larTemporarioId }` final ou um erro tipado. Regras, em ordem:
  1. Campo ausente mantém o valor atual (RF-013a). No create, o "atual" é
     `NAO_SE_APLICA`/`null`.
  2. Animal de acolhedor: `situacaoLT ≠ NAO_SE_APLICA` ou `larTemporarioId ≠ null` explícitos →
     `FOSTER_STATE_NOT_ALLOWED` (RF-010, C6).
  3. Status final `ADOTADO`:
     - entrada **explícita** com `situacaoLT ≠ NAO_SE_APLICA` ou `larTemporarioId ≠ null` →
       `FOSTER_STATE_NOT_ALLOWED` (RF-010, CA-04);
     - campos ausentes → reset para `NAO_SE_APLICA`/`null` (RF-013, CA-03).

     O `AnimalForm` **omite** os campos de LT quando o status escolhido é `ADOTADO`. Assim o caminho
     do formulário cai sempre no reset, e o payload incoerente vindo direto pela API é rejeitado.
  4. `situacaoLT` final diferente de `EM_LT` → `larTemporarioId = null`, mesmo que viesse preenchido
     (RF-012). O mesmo vale quando a entrada traz `larTemporarioId` não nulo com `situacaoLT ≠ EM_LT`
     explícito: `INVALID_FOSTER_LINK` (RF-011, CA-04).
  5. `larTemporarioId` final não nulo → precisa existir um `LarTemporario` com esse id **e** o mesmo
     `organizacaoId` do animal. Senão: `INVALID_FOSTER_LINK` (400), sem revelar se o LT existe em
     outra ONG.
- `FOSTER_RESET_ON_ADOPTION = { situacaoLT: NAO_SE_APLICA, larTemporarioId: null }`, um objeto
  constante espalhado no `data` de `completeAdoption` e de `updateAnimalStatus` quando o status vai a
  `ADOTADO`.
- `inTreatmentWhere` (R5).

O passo 5 é a única consulta ao banco: `prisma.larTemporario.findFirst({ where: { id, organizacaoId } })`.

**Motivo.**
- A mesma regra é usada em `createAnimal`, `updateAnimal`, `updateAnimalStatus` e `completeAdoption`
  (mais de dois lugares concretos), o que atende ao princípio I.
- Funções puras ficam testáveis sem banco, no padrão dos testes que mockam o Prisma.

**Alternativas rejeitadas.**
- *Repetir a regra inline em cada action:* é exatamente a divergência entre caminhos que o §9.1
  registra.
- *Remover `updateAnimalStatus`:* fora do escopo ("mudar o mínimo"); está anotado em "Para quem vier
  depois".

**Concorrência.** `completeAdoption` grava o reset no **mesmo** `updateMany` condicional (`where:
{ status: EM_PROCESSO_ADOCAO }`) que já existe, então é atômico. `updateAnimal` continua com
`update` simples: vale a última gravação (RF-013a).

---

## R5 — Derivar "Em tratamento"

**Fato.** O `CuidadoPlanejado` tem `@@index([tipo, status, dataHoraPlanejada])` e `@@index([animalId])`.
O volume é de dezenas de animais por ONG.

**Decisão.** Um fragmento de filtro em `lib/lar-temporario.ts`, ou no módulo de queries que o plano
indicar:

```ts
export const inTreatmentWhere = {
  status: { not: StatusAnimal.ADOTADO },
  cuidadosPlanejados: {
    some: {
      tipo: TipoCuidadoPlanejado.MEDICAMENTO_TRATAMENTO,
      status: StatusCuidadoPlanejado.PENDENTE,
    },
  },
} satisfies Prisma.AnimalWhereInput;
```

Ele é usado em três lugares:
- **Lista e detalhe** (`ownedAnimalSummarySelect`): ganham `_count.cuidadosPlanejados` com o mesmo
  `where` interno. O DTO calcula `emTratamento = count > 0 && status !== ADOTADO`.
- **Filtro** `tratamento=1`: `AND: [inTreatmentWhere]` no `buildFilterWhere`.
- **Card do dashboard:** `prisma.animal.count({ where: { ...ownerWhere, ...inTreatmentWhere } })`.

Não há coluna nova nem job. A data do cuidado não entra no filtro (C8), e um cuidado atrasado continua
contando.

**Motivo.** É uma subconsulta `EXISTS` coberta por índice. A mesma definição nos três usos garante que
badge, filtro e card nunca divirjam.

**Alternativas rejeitadas.**
- *Coluna booleana `emTratamento`:* contraria D3 e desatualiza.
- *Heurística sobre `RegistroSaude`:* contraria C9.

---

## R6 — "Em tratamento" alcançável pela interface

**Fato.** O `HealthPanel` só tem `VacinaForm`, `ParasitaForm` e `TesteForm`. O `CompletionForm`
(`_authenticated.dashboard.saude.index.tsx:500`) envia só `dataAplicacao`. No backend,
`medicamentoTratamentoSchema` aceita `dataProxima` (`lib/schemas/registro-saude.ts:51`), e
`concluirCuidadoSchema = registroSaudeSchema` aceita o mesmo. `syncPlannedCare` e `createNextCare` já
criam o `CuidadoPlanejado` `PENDENTE` quando há `dataProxima`.

**Decisão (Clarification de 2026-10-14).** Só frontend:
- `TratamentoForm` no `HealthPanel`, no molde do `ParasitaForm`: campos `medicamentoTratamento`,
  `dataAplicacao`, "Próxima dose (opcional)" e o texto de dica do RF-008.
- No `CompletionForm`, campo "Próxima dose (opcional)" quando `item.tipo === "MEDICAMENTO_TRATAMENTO"`,
  enviado como `dataProxima`.
- Ajustar os tipos `frontend/src/lib/data/saude.ts` e `frontend/src/lib/data/cuidados.ts` para aceitar
  `dataProxima` em `MEDICAMENTO_TRATAMENTO`.
- Schema Zod do cliente em `frontend/src/lib/schemas/registroSaude.ts`.

**Motivo.** Os contratos já existem e já são testados. Sem esta tela, o CA-01 só seria verificável
com dado semeado.

---

## R7 — API do lar temporário

**Decisão.** Rotas novas sob `/api/lares-temporarios`, no padrão de `responsible-http.ts`:

1. `requireActiveResponsible()`, que chama `getServerSession()` antes de tocar dados.
2. Se `context.tipoPerfil !== ORGANIZACAO` → **403** `FORBIDDEN` (RF-020, CA-07).
3. Toda consulta e escrita usa `where: { id, organizacaoId: context.responsavelId }`.
4. LT ausente **ou** de outra ONG → **404** `NOT_FOUND`, indistinguíveis (RF-026).

As actions ficam em `lib/actions/lares-temporarios.ts`, recebendo o `ResponsibleContext` (padrão de
`decideAdoptionRequest`). As consultas ficam em `lib/queries/lares-temporarios.ts`.

**Vincular (`POST …/[id]/animais`).** Um `updateMany` condicional:

```
where: { id: animalId, organizacaoId, situacaoLT: EM_LT, larTemporarioId: null }
data:  { larTemporarioId: ltId }
```

Antes, confirma que o LT pertence à ONG. Se `count === 0`, responde **409** `INVALID_TRANSITION`
("o animal não está mais disponível para vínculo"). A condição no `where` torna atômica a regra do
RF-024.

**Desvincular (`DELETE …/[id]/animais/[animalId]`).** `updateMany` com
`where: { id: animalId, organizacaoId, larTemporarioId: ltId }` e `data: { larTemporarioId: null }`.
`situacaoLT` continua `EM_LT` (RF-023). Se `count === 0`, responde 404.

**Excluir (`DELETE /api/lares-temporarios/[id]`).** `deleteMany({ where: { id, organizacaoId } })`. A
FK `ON DELETE SET NULL` desvincula os animais no mesmo comando (RF-025), e `count === 0` responde 404.
Não há "desativar" (C4).

**Autorização do tutor (C3).** O corpo do `POST` exige `autorizacaoTutor: z.literal(true)`, que é
validado e **descartado**, nunca persistido. O `PATCH` não o exige: a autorização é do cadastro.

---

## R8 — Filtros e indicadores do painel

**Fato.** `ownedAnimalFilterSchema` é `.strict()` e não conhece o perfil. A lista
`_authenticated.dashboard.animais.index.tsx` guarda o filtro de status em `useState` e **não lê** a
URL. Por isso os cards atuais do dashboard (`/dashboard/animais?status=EM_CUIDADOS`) **não filtram**
hoje, um defeito pré-existente.

**Decisão.**
- Schema: `lt` = `optionalEnumParam(z.enum(["NAO_SE_APLICA","PROCURANDO","EM_LT","EM_LT_SEM_VINCULO"]))`
  e `tratamento` = `optionalEnumParam(z.literal("1"))`.
- Rota `GET /api/animais/gerenciados`: depois do parse, `lt` presente com perfil `ACOLHEDOR` → **400**
  `VALIDATION_ERROR` (RF-018).
- Query: `EM_LT_SEM_VINCULO` vira `{ situacaoLT: EM_LT, larTemporarioId: null }`.
- Frontend: a rota de lista ganha `validateSearch` (`status`, `lt`, `tratamento`). Os selects passam a
  ler e escrever a URL, e os cards existentes e novos filtram de verdade (RF-019). Isso corrige o
  defeito pré-existente: é necessário para o RF-019, não é escopo novo.
- Dashboard: `indicators` ganha `animalsInTreatment` (todos os perfis) e, **só para ONG**,
  `animalsSeekingFoster` e `animalsInFosterUnregistered`. Para acolhedor esses dois campos são
  **omitidos** do JSON. Hrefs: `?tratamento=1`, `?lt=PROCURANDO`, `?lt=EM_LT_SEM_VINCULO`. As contagens
  de LT excluem `ADOTADO` por invariante: `ADOTADO` sempre tem `NAO_SE_APLICA`.

---

## R9 — Frontend: forma das telas

**Decisões.**
- **Badges** (RF-016) num componente novo, `components/app/AnimalIndicators.tsx`, usado na lista e no
  detalhe (dois lugares, o que atende ao princípio I). Texto sempre visível, sem depender só de cor
  (padrão de acessibilidade da 004). Tokens semânticos, nunca cor hardcoded (§8 do `CLAUDE.md`).
- **`AnimalForm`:**
  - select "Lar temporário (LT)" e, se `EM_LT`, select "Vinculado a" com os LTs de
    `GET /api/lares-temporarios`;
  - os dois só renderizam quando a sessão é `ORGANIZACAO` e o status escolhido não é `ADOTADO`;
  - no submit, os campos de LT são **omitidos** quando o status é `ADOTADO` (R4.3);
  - aviso inline quando o usuário tira de `EM_LT` um animal vinculado (RF-012);
  - texto de ajuda dinâmico sob o Status (RF-004).
- **Aba**:
  - rotas `_authenticated.dashboard.lares-temporarios.tsx` (layout com `<Outlet />`, igual a
    `…animais.tsx`), `….lares-temporarios.index.tsx` (lista e cadastro em diálogo) e
    `….lares-temporarios.$larId.tsx` (detalhe, edição, vincular, desvincular e excluir);
  - o item de menu só aparece para `ORGANIZACAO` (`_authenticated.dashboard.tsx:65`);
  - acolhedor que digitar a URL vê uma explicação, sem redirect, seguindo o padrão do `/feels` (o
    defeito F3 da ROUTES-01 não é repetido).
- **Busca por nome** na lista de LTs: filtro no cliente, sobre a lista inteira, normalizando acentos
  com `String.prototype.normalize("NFD")`. A lista é pequena (dezenas por ONG), e isso evita a
  armadilha "busca sem acento" (§10 do `CLAUDE.md`) sem coluna normalizada. É estado de UI
  transitório, permitido pelo princípio VI.
- **Diálogo de exclusão** lista os animais vinculados, que vêm do `GET` do detalhe.
- **`routeTree.gen.ts`** muda (rotas novas), então **é commitado** (§5 do `CLAUDE.md`).

**Dependências.** Nenhuma nova. Diálogo, select, checkbox, badge e input já existem em
`components/ui` (shadcn).

---

## R10 — Testes afetados e testes novos

**Fato.** O backend usa Vitest com o Prisma mockado (`npm test`, 367 testes na 008). O frontend não
tem runner de teste: o portão dele é `tsc` mais `build`.

**Testes existentes que mudam:**

| Arquivo | Motivo |
|---|---|
| `__tests__/actions/animais.test.ts` | fixtures `RESGATADO` (linhas 29, 229, 243, 260, 283, 306); `update` passa a montar `data` explícito |
| `__tests__/actions/animal-publication.test.ts` | fixtures `RESGATADO` (linhas 30, 166, 180) |
| `__tests__/api/owner-animals.test.ts` | fixture `RESGATADO` (linha 174); novo caso `lt` com acolhedor → 400 |
| `__tests__/actions/solicitacoes.test.ts` | `completeAdoption`: o `updateMany` do animal passa a incluir o reset |
| `__tests__/queries/operational-dashboard.test.ts` | `statusInitial` sem `RESGATADO`; novos indicadores |
| `__tests__/actions/health-chat-dashboard-flow.test.ts` | contagens do dashboard |
| `__tests__/queries/owned-animals.test.ts` | DTO com `situacaoLT`, `larTemporario`, `emTratamento`; filtros novos |
| `__tests__/schemas/dashboard-filters.test.ts` | `lt` e `tratamento` |

**Testes novos [TEST-FIRST]**, vermelhos contra a implementação ingênua, conforme o princípio IX:

| Arquivo | Cobre |
|---|---|
| `__tests__/lib/lar-temporario.test.ts` | `resolveFosterState`: ausente mantém; acolhedor rejeitado; `ADOTADO` explícito rejeitado e ausente resetado; sair de `EM_LT` desvincula; vínculo sem `EM_LT` rejeitado; LT de outra ONG → `INVALID_FOSTER_LINK` (RF-010 a RF-013a, CA-03, CA-04) |
| `__tests__/actions/animais.test.ts` (casos novos) | `updateAnimal` e `updateAnimalStatus` gravando o reset ao virar `ADOTADO` (CA-03) |
| `__tests__/actions/solicitacoes.test.ts` (caso novo) | `completeAdoption` grava `NAO_SE_APLICA`/`null` no mesmo `updateMany` (CA-03) |
| `__tests__/api/lares-temporarios.test.ts` | CRUD; acolhedor 403; ONG B → 404 em ler, editar, excluir e vincular; `autorizacaoTutor` ausente → 400; vincular só `EM_LT` sem vínculo (409 caso contrário); desvincular mantém `EM_LT`; excluir usa `where` com `organizacaoId` (CA-05 a CA-07) |
| `__tests__/queries/lt-privacy.test.ts` | chama `animal-showcase`, `public-animal`, `feels`, `favorites`, `adopter-requests`, `adotante-dashboard`, `mensagens` e `public-profiles` com o Prisma mockado e verifica que nenhum argumento de consulta nem DTO contém `situacaoLT`, `larTemporario` ou `larTemporarioId`. É vermelho contra um `include: { animal: true }` ingênuo (RF-015, CA-01) |
| `__tests__/queries/owned-animals.test.ts` (casos novos) | `emTratamento` falso em `ADOTADO` mesmo com cuidado pendente; filtro `tratamento=1` usa `inTreatmentWhere` (CA-08) |

Hoje o RF-015 **já vale**: todas as consultas de adotante e públicas usam `select` explícito sobre o
animal (`adopter-requests.ts:11`, `favorites.ts:10`, `mensagens.ts:88/161`, `public-animal.ts:6`,
`feels.ts`, `animal-showcase.ts:56`, `public-profiles.ts`). O teste de privacidade é **regressão**:
ele trava o comportamento atual.

**O que o Vitest não prova.** O `ON DELETE SET NULL` real, a migration de enum e o drift. Isso fica
para o ensaio no branch do Neon (quickstart).
