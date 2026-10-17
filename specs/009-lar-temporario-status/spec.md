# Spec 009 — Lar temporário e reforma do status

**Branch (implementação):** `009-lar-temporario-status`
**Criada em:** 2026-10-14
**Status:** Em especificação — aprovada na sabatina de 2026-10-14
**Execução:** Pedro (`pedroviana0`), sozinho, com acordo do Arthur (mantenedor) registrado em
2026-10-14. O alinhamento previsto em D9 está resolvido.
**Origem da sabatina:** [`GRILLING-BRIEF.md`](GRILLING-BRIEF.md)

## Objetivo

Separar as três informações que hoje se misturam no campo `Animal.status` — **etapa da adoção**,
**saúde** e **lar temporário (LT)** — para que a ONG consiga representar casos reais como o da
Seninha, e dar à Organização uma aba de gestão de lares temporários.

## Contexto e origem

Feedback do Luiz (Cia Animal VR — Grupo de Proteção Animal VR) na validação do sistema:

- Pediu as opções "Em lar temporário" e "Procurando lar temporário" (sigla das ONGs: **LT**).
- Achou o status **Resgatado** redundante: todo animal na plataforma foi resgatado.
- **Caso Seninha:** está na clínica tomando antibiótico, mas já pode ser adotada (o adotante
  continua o antibiótico em casa) e também precisa de LT. Com `status` como campo único, o sistema
  não consegue representar isso.
- Sugeriu diferenciar "disponível para adoção" de "disponível para LT e adoção".

**Diagnóstico:** `status` carrega três dimensões. A spec mantém `status` como etapa da adoção,
deriva "em tratamento" da Central de Saúde e cria um campo próprio para LT.

## Fatos do código que condicionam o desenho (levantados em 2026-10-14)

- `StatusAnimal` = `RESGATADO, EM_CUIDADOS, DISPONIVEL, EM_PROCESSO_ADOCAO, ADOTADO`, default
  `RESGATADO` (`prisma/schema.prisma`). O `AnimalForm` já cria como `EM_CUIDADOS`; o seed não usa
  `RESGATADO`.
- **`ADOTADO` tem dois caminhos:** a conclusão da solicitação (`lib/actions/solicitacoes.ts`,
  chamada por `app/api/solicitacoes/gerenciadas/[id]`) e o select manual do formulário
  (`updateAnimal` aceita qualquer status; a única trava é a de 2 fotos ao publicar).
- Um `CuidadoPlanejado` `MEDICAMENTO_TRATAMENTO` só nasce quando o registro de saúde informa
  **próxima dose** (`dataProxima`, em `lib/actions/registro-saude.ts` e
  `lib/actions/cuidados-planejados.ts`). A criação avulsa de cuidado gera apenas `CONSULTA`.
- Contas nunca são excluídas: o admin só desativa (`Usuario.ativo`). Não existe fluxo de exclusão de
  Organização. `Animal→Organizacao` não tem `onDelete`.
- O painel já tem cards por status com link para `/dashboard/animais?status=…`
  (`lib/queries/operational-dashboard.ts`), e "Meus animais" filtra por `q`, `status`, `especieId`,
  `racaId`, `porte`, `sexo` com schema `.strict()` (`lib/schemas/dashboard-filters.ts`).
- O menu do painel é o mesmo para ONG e acolhedor (`frontend/src/routes/_authenticated.dashboard.tsx`).

## Clarifications

### Session 2026-10-14

- Q: Dados de LT ficam fora só dos endpoints públicos ou de tudo que não é gestão? → A: De tudo que não é gestão da ONG dona. Todo endpoint alcançável por visitante ou adotante (públicos, favoritos, solicitações do adotante, conversas) usa `select` explícito sem campos de LT, com teste de ausência.
- Q: Em que ordem migration e código vão para produção, já que o build da Vercel não aplica migrations? → A: O Pedro (executor da 009) aplica as duas migrations em produção **antes** do merge na `main`, depois do ensaio no branch do Neon; o deploy do código vem em seguida.
- Q: O que significa `situacaoLT`/`larTemporarioId` ausente no payload do animal? → A: Campos opcionais; no update, ausente = mantém o valor atual; no create, ausente = `NAO_SE_APLICA`/`null`. O formulário da ONG sempre envia os dois; entre formulário e aba vale a última gravação.
- Q: Que validação os campos do LT seguem? → A: Os validadores da 007 em `lib/schemas/common.ts`: `nomeTutor` = `personNameSchema`, `telefone` = `phoneSchema` (só dígitos), `endereco` = `addressSchema`, `cidade` obrigatória de 2 a 80 caracteres, `observacoes` opcional até 1.000; os mesmos schemas valem no frontend e no backend.
- Q: (durante o `/speckit-plan`) Como o "Em tratamento" fica alcançável pela UI, se o `HealthPanel` não tem formulário de medicamento/tratamento e o `CompletionForm` não envia próxima dose? → A: Criar o formulário "Medicamento / tratamento" no `HealthPanel` (com "Próxima dose" e a dica) e acrescentar "Próxima dose (opcional)" ao `CompletionForm` para `MEDICAMENTO_TRATAMENTO`. Só frontend; os contratos de backend já aceitam `dataProxima`.
- Q: O indicador "Em tratamento" vale para animal `ADOTADO`? → A: Não. Badge, filtro `tratamento=1` e card consideram só animais não `ADOTADO`; os cuidados pendentes do adotado continuam na Central de Saúde, sem mudança.

## Decisões

### Rodada 1 (aceitas em 2026-10-14, antes da sabatina)

| # | Decisão | Justificativa |
|---|---|---|
| D1 | Remover `RESGATADO` de `StatusAnimal`; migration converte as linhas para `EM_CUIDADOS`; `@default(EM_CUIDADOS)`. | Todo animal da plataforma foi resgatado; o status não informa nada. O sistema já tem dados reais (Neon), por isso a conversão é ensaiada antes. |
| D2 | `EM_CUIDADOS` passa a significar **"ainda não anunciado"**. Animal em tratamento que já pode ser adotado fica `DISPONIVEL`. | Status volta a ser só a etapa da adoção. |
| D3 | **"Em tratamento" é derivado**, sem coluna: existe `CuidadoPlanejado` `MEDICAMENTO_TRATAMENTO` pendente. | Mesma regra das tags derivadas; evita dado duplicado que desatualiza. |
| D4 | O indicador "Em tratamento" aparece **só no painel**. | Escopo e prazo. |
| D5 | Campo `situacaoLT` no `Animal`: `NAO_SE_APLICA` (padrão) · `PROCURANDO` · `EM_LT`. Editável em `EM_CUIDADOS`, `DISPONIVEL`, `EM_PROCESSO_ADOCAO`; volta a `NAO_SE_APLICA` e desvincula ao virar `ADOTADO`. | LT é independente da etapa da adoção (caso Seninha). |
| D6 | Só **Organização** tem o campo e a aba de LT. | O acolhedor independente já é, por definição, o LT do animal. |
| D7 | **Nada de LT** na vitrine, card público, Feels ou perfil público. | É gestão; nem toda ONG usa LT. Divulgar pedidos de LT vai para trabalhos futuros. |
| D8 | Entidade `LarTemporario` da Organização; `Animal.larTemporarioId` opcional, só com `situacaoLT = EM_LT`. Um LT por vez, **sem histórico**. `EM_LT` sem LT vinculado é válido. | A ONG pode registrar o LT depois. |
| D9 | Entregue e testada até o início de novembro de 2026; depois, DER, diagrama de classes, casos de uso e doc v21, congelados antes da banca (02/12/2026). ~~Alinhar com o Arthur antes de implementar.~~ **Resolvido em 2026-10-14:** o Pedro executa a 009 sozinho, com acordo do Arthur; as tarefas antes atribuídas ao mantenedor são do Pedro. | Calendário do TCC. |

### Sabatina (2026-10-14)

| # | Pergunta | Decisão | Justificativa |
|---|---|---|---|
| C1 | Campos do `LarTemporario`? | **Provisórios:** `nomeTutor`*, `telefone`*, `endereco` (texto livre)*, `cidade`*, `observacoes`. Sem CPF, sem CEP, sem capacidade, sem espécies aceitas, sem data de início. | Formulário da Cia Animal ainda não chegou. CPF fora por minimização (LGPD). CEP fora porque o LT não entra em cálculo de distância — não justifica chamar API externa. Data de início pertence ao vínculo, e D8 descartou histórico. |
| C2 | Quem vê os dados do LT? | **Só a conta da ONG dona.** O admin não ganha tela; nenhum endpoint público expõe LT. | Dado pessoal de terceiro sem conta na plataforma. |
| C3 | Base legal (LGPD)? | A ONG é **controladora**; a plataforma, **operadora**. Cadastro exige checkbox "O tutor temporário autorizou o registro destes dados na plataforma"; o aceite **não** é persistido. | Mesmo espírito da declaração de veracidade da 008; defensável na banca sem nova tabela. |
| C4 | Excluir LT com animais vinculados? | **Exclusão física**, após diálogo que lista os animais. Os animais perdem o vínculo e **continuam `EM_LT`** (sem registro). Edição permitida; **sem "desativar"**. | Não reter dado pessoal de quem saiu; o estado resultante é válido por D8 e aparece no painel como pendência. |
| C5 | Sair de `EM_LT` com vínculo? | Servidor zera `larTemporarioId` automaticamente; a UI avisa ("o vínculo com <LT> será removido"), não bloqueia. | Invariante de D8 garantido no backend. |
| C6 | Integridade referencial? | `LarTemporario.organizacao` `onDelete: Cascade`; `Animal.larTemporario` `onDelete: SetNull`. Desativar conta não mexe em LTs. Backend rejeita `situacaoLT ≠ NAO_SE_APLICA` em animal de acolhedor. | Preparado para eventual exclusão de ONG; XOR do responsável + D6. |
| C7 | Reset de D5 em qual caminho? | **Nos dois:** conclusão da solicitação **e** `updateAnimal` com status manual `ADOTADO`. O `ADOTADO` manual continua permitido. | Ver §9.1 do `CLAUDE.md` (regra duplicada entre caminhos); mudar o mínimo. |
| C8 | Regra exata de "Em tratamento"? | Existe ≥1 `CuidadoPlanejado` com `tipo = MEDICAMENTO_TRATAMENTO` e `status = PENDENTE`, **qualquer data** (inclusive atrasado). `CONCLUIDO`/`CANCELADO` não contam. | Dose não marcada = tratamento não terminou. Concluir sem próxima dose encerra o indicador sozinho. |
| C9 | Tratamento registrado sem próxima dose? | **Limitação aceita e documentada.** O formulário de registro de saúde ganha a dica: "Informe a próxima dose para o animal aparecer como em tratamento." | Heurística sobre `RegistroSaude` contrariaria D3. |
| C10 | Forma da migration? | **Duas migrations:** (1) reforma do status; (2) lar temporário. Conversão `RESGATADO→EM_CUIDADOS` é **irreversível** (aceito). Ensaio num **branch do Neon** criado pelo Pedro a partir da produção. | Validar e reverter cada parte isoladamente; PostgreSQL não remove valor de enum. |
| C11 | Fora de escopo? | Ver seção "Fora de escopo". | — |
| C12 | LT no formulário do animal? | Só para ONG: select **"Lar temporário (LT)"** abaixo do Status; com `EM_LT`, select opcional **"Vinculado a"** (LTs da ONG + "Ainda não registrado"). Vínculo possível **pelo formulário ou pela aba**. Oculto para acolhedor e quando o status é `ADOTADO`. | Uma porta a mais custa um select; evita ida e volta entre telas. |
| C13 | Como explicar "Em cuidados"? | Enum e rótulo mantidos; **texto de ajuda dinâmico** sob o select de Status (ex.: `EM_CUIDADOS` → "Não aparece na vitrine. Use enquanto o animal não pode ser anunciado."; `DISPONIVEL` → "Aparece na vitrine. Pode estar em tratamento."). | Muda o significado sem renomear enum. |
| C14 | Rótulos de LT? | Campo "Lar temporário (LT)"; `NAO_SE_APLICA` = "Não precisa", `PROCURANDO` = "Procurando LT", `EM_LT` = "Em LT". | Sigla das ONGs, explicada uma vez. |
| C15 | Onde aparecem os indicadores? | Em "Meus animais" (linha) e no detalhe do animal, ao lado do `StatusBadge`: "Em tratamento" (ONG e acolhedor); "Procurando LT" / "Em LT · <nome do tutor>" / "Em LT · sem registro" (só ONG). | D4 e D7. |
| C16 | Cards do painel? | Novos, contando só animais não `ADOTADO`: "Em tratamento" (ONG e acolhedor), "Procurando LT" e "Em LT sem registro" (só ONG), com link para "Meus animais" filtrado. | Organização: ver o que precisa de LT. |
| C17 | Filtros em "Meus animais"? | `lt` (`NAO_SE_APLICA`, `PROCURANDO`, `EM_LT`, `EM_LT_SEM_VINCULO`; só ONG) e `tratamento=1`. Acolhedor enviando `lt` recebe **400**. | Coerente com o schema `.strict()`. |
| C18 | Estrutura da aba? | Ver RF-020 a RF-026. | — |
| C19 | Seed? | 2 LTs para `organizacao.teste`; `situacaoLT` em ciclo que não se alinha com espécie/sexo/cidade (§11 do `CLAUDE.md`); um animal estilo Seninha (`DISPONIVEL` + tratamento pendente com próxima dose + `PROCURANDO`). | Dados de teste que exercitam filtros e cards. |

## Requisitos funcionais

### Status

- **RF-001** `StatusAnimal` deixa de ter `RESGATADO`; o default de `Animal.status` passa a ser `EM_CUIDADOS`.
- **RF-002** A migration converte toda linha `RESGATADO` em `EM_CUIDADOS` antes de trocar o tipo.
- **RF-003** O frontend remove `RESGATADO` de `enums.ts`, `schemas/animal.ts` e `StatusBadge.tsx`; os testes que citam `RESGATADO` são atualizados.
- **RF-004** O select de Status no `AnimalForm` mostra texto de ajuda dinâmico por status (C13).
- **RF-005** `DISPONIVEL` continua sendo o único status público (vitrine, Feels, favoritos, solicitações, perfil público). Esta spec não muda isso.

### Em tratamento (derivado)

- **RF-006** Um animal está "em tratamento" quando **não** está `ADOTADO` e tem ≥1 `CuidadoPlanejado` `MEDICAMENTO_TRATAMENTO` `PENDENTE`, de qualquer data (C8). Nenhuma coluna nova. A mesma regra vale para o badge, o filtro `tratamento=1` e o card. Os cuidados pendentes de um animal adotado continuam na Central de Saúde, sem mudança.
- **RF-007** O indicador aparece só no painel: lista "Meus animais", detalhe do animal e card do dashboard (C15, C16). Vale para ONG e acolhedor.
- **RF-008** O `HealthPanel` ganha o formulário **"Medicamento / tratamento"** (campos do
  `medicamentoTratamentoSchema` existente, incluindo "Próxima dose"), com a dica: "Informe a próxima
  dose para o animal aparecer como em tratamento" (C9). O `CompletionForm` da agenda ganha
  **"Próxima dose (opcional)"** quando o cuidado é `MEDICAMENTO_TRATAMENTO`, para o tratamento
  continuar depois de cada dose marcada. Só frontend: os contratos `POST
  /api/animais/gerenciados/[id]/saude` e `POST /api/saude/cuidados/[id]/concluir` já aceitam
  `dataProxima`.

### Situação de LT

- **RF-009** `Animal.situacaoLT` (`NAO_SE_APLICA` padrão, `PROCURANDO`, `EM_LT`) é independente do status.
- **RF-010** `situacaoLT ≠ NAO_SE_APLICA` só é aceito para animal de Organização e com status `EM_CUIDADOS`, `DISPONIVEL` ou `EM_PROCESSO_ADOCAO`; caso contrário, o backend rejeita.
- **RF-011** `larTemporarioId` só é aceito com `situacaoLT = EM_LT` e quando o LT pertence à mesma Organização do animal.
- **RF-012** Ao trocar `situacaoLT` de `EM_LT` para outro valor, o backend zera `larTemporarioId` (C5); a UI avisa antes de salvar.
- **RF-013** Ao virar `ADOTADO` — pela conclusão da solicitação **ou** pelo `updateAnimal` — o backend grava `situacaoLT = NAO_SE_APLICA` e `larTemporarioId = null` (C7). Nos dois caminhos, na mesma transação da troca de status.
- **RF-013a** No schema do animal (`animalInputSchema`), `situacaoLT` e `larTemporarioId` são
  **opcionais**. No update, campo ausente mantém o valor atual; no create, ausente vale
  `NAO_SE_APLICA`/`null`. O acolhedor nunca envia os campos. O formulário da ONG envia sempre os dois.
  Entre formulário e aba vale a **última gravação** (uma conta por ONG; o RF-011 valida o resultado).
- **RF-014** O `AnimalForm` da ONG mostra os selects "Lar temporário (LT)" e, com `EM_LT`, "Vinculado a" (C12). Acolhedor não vê; status `ADOTADO` oculta os dois.
- **RF-015** `situacaoLT`, `larTemporarioId` e dados de LT só saem nos endpoints de gestão da ONG dona do animal. Nenhum endpoint alcançável por visitante ou adotante — vitrine, detalhe público, Feels, favoritos, perfil público, solicitações do adotante e conversas — os inclui na resposta; essas consultas usam `select` explícito, nunca `include: { animal: true }` (D7, C2).

### Painel

- **RF-016** "Meus animais" e o detalhe do animal exibem os badges de C15.
- **RF-017** O dashboard ganha os cards de C16, contando apenas animais não `ADOTADO`.
- **RF-018** `ownedAnimalFilterSchema` ganha `lt` (`NAO_SE_APLICA` | `PROCURANDO` | `EM_LT` | `EM_LT_SEM_VINCULO`) e `tratamento=1`; `lt` vindo de acolhedor responde 400 (C17).
- **RF-019** Os cards linkam para "Meus animais" com o filtro correspondente.

### Aba "Lares temporários" (só Organização)

- **RF-020** Rota `/dashboard/lares-temporarios`, no menu apenas para Organização. A API de LT responde 403 para qualquer outro perfil.
- **RF-021** Lista dos LTs da ONG: nome do tutor, cidade, telefone e quantidade de animais vinculados, com busca por nome.
- **RF-022** Cadastro e edição com os campos de C1; o cadastro exige o checkbox de autorização (C3), validado no backend e não persistido.
- **RF-022a** Validação dos campos do LT, reaproveitando os validadores da 007 (`lib/schemas/common.ts`)
  com as mesmas regras no frontend e no backend: `nomeTutor` = `personNameSchema` (de 3 a 120 caracteres,
  sem números); `telefone` = `phoneSchema` (DDD + 8 ou 9 dígitos, guardado só em dígitos);
  `endereco` = `addressSchema` (de 3 a 200 caracteres); `cidade` obrigatória, de 2 a 80 caracteres;
  `observacoes` opcional, até 1.000 caracteres.
- **RF-023** Detalhe do LT: dados e animais vinculados, com ação "Desvincular" (o animal continua `EM_LT`, sem registro).
- **RF-024** "Vincular animal" lista **apenas** animais da própria ONG com `situacaoLT = EM_LT` e `larTemporarioId = null`.
- **RF-025** Excluir LT: diálogo listando os animais vinculados; confirmação apaga a linha do LT definitivamente e os animais ficam `EM_LT` sem registro (C4).
- **RF-026** Toda leitura e escrita de LT é escopada pelo `organizacaoId` do contexto; LT de outra ONG responde 404.

### Seed

- **RF-027** O seed cria os dados de C19.

## Modelo de dados

```prisma
enum StatusAnimal {
  EM_CUIDADOS          // agora: "ainda não anunciado"
  DISPONIVEL
  EM_PROCESSO_ADOCAO
  ADOTADO
}

enum SituacaoLT {
  NAO_SE_APLICA
  PROCURANDO
  EM_LT
}

model Animal {
  // ...campos atuais
  status          StatusAnimal    @default(EM_CUIDADOS)
  situacaoLT      SituacaoLT      @default(NAO_SE_APLICA)
  larTemporarioId String?
  larTemporario   LarTemporario?  @relation(fields: [larTemporarioId], references: [id], onDelete: SetNull)

  @@index([larTemporarioId])
}

model LarTemporario {
  id            String      @id @default(cuid())
  organizacaoId String
  organizacao   Organizacao @relation(fields: [organizacaoId], references: [id], onDelete: Cascade)
  nomeTutor     String
  telefone      String
  endereco      String
  cidade        String
  observacoes   String?
  criadoEm      DateTime    @default(now())
  atualizadoEm  DateTime    @default(now()) @updatedAt
  animais       Animal[]

  @@index([organizacaoId])
}
```

Campos do `LarTemporario` são **provisórios** até o formulário da Cia Animal.

**Invariantes (garantidos no backend):** `larTemporarioId ≠ null ⇒ situacaoLT = EM_LT`;
`situacaoLT ≠ NAO_SE_APLICA ⇒ animal de Organização ∧ status ∈ {EM_CUIDADOS, DISPONIVEL, EM_PROCESSO_ADOCAO}`;
`larTemporario.organizacaoId = animal.organizacaoId`.

### Migrations (C10)

1. **Reforma do status**, numa transação: `UPDATE "Animal" SET status='EM_CUIDADOS' WHERE status='RESGATADO'`
   → criar `StatusAnimal_new` → `ALTER COLUMN status DROP DEFAULT` →
   `ALTER COLUMN status TYPE "StatusAnimal_new" USING status::text::"StatusAnimal_new"` →
   `DROP TYPE "StatusAnimal"` → `ALTER TYPE "StatusAnimal_new" RENAME TO "StatusAnimal"` →
   `SET DEFAULT 'EM_CUIDADOS'`. Irreversível quanto à distinção `RESGATADO`.
2. **Lar temporário:** enum `SituacaoLT`, coluna `situacaoLT` com default, tabela `LarTemporario`, FK e índices.

Ambas ensaiadas num branch do Neon (criado pelo Pedro a partir da produção) antes da produção.

**Ordem de virada (o build da Vercel só roda `prisma generate`; `migrate deploy` é manual):**
1. ensaio das duas migrations no branch do Neon;
2. o Pedro aplica as duas migrations em produção;
3. merge do PR na `main` e deploy do código.

Código antes da migration derruba a vitrine com 500 (o Prisma Client pede `situacaoLT`, que ainda
não existe). Na ordem acima, o código antigo convive com o banco novo: a coluna tem default e não
sobra linha `RESGATADO`. O único efeito é que salvar "Resgatado" no formulário antigo falha durante
a janela até o deploy.

## Fora de escopo

- LT visível na vitrine, card público, Feels ou perfil público (D7).
- Pedido ou divulgação de LT pela plataforma (trabalhos futuros do TCC).
- Histórico de passagens por LT.
- LT para acolhedor independente.
- Conta ou login para o tutor temporário.
- Galeria pública de adotados.
- Notificações ligadas a LT.
- Capacidade e espécies aceitas do LT (até o formulário da Cia Animal).
- Travar o `ADOTADO` manual no formulário.
- "Em tratamento" fora do painel (D4).

## Pendências externas

- **Luiz (Cia Animal VR):** enviar o formulário de LT, que define os campos definitivos de `LarTemporario`.
- **Luiz:** confirmar que LT fica só na gestão.
- **Luiz:** confirmar se um animal pode precisar de LT sem estar disponível para adoção (o modelo já permite: `EM_CUIDADOS` + `PROCURANDO`).

Os passos operacionais de banco (branch do Neon, `migrate deploy` em produção, merge) são do Pedro e
estão em `tasks.md`; não são pendências externas.

## Critérios de aceitação

- **CA-01 (Seninha):** animal de ONG `DISPONIVEL`, com `CuidadoPlanejado` `MEDICAMENTO_TRATAMENTO` pendente e `situacaoLT = PROCURANDO`:
  aparece na vitrine, no Feels, no card público e no perfil público como qualquer disponível, **sem**
  texto, campo ou atributo de LT ou tratamento no HTML nem no JSON de nenhum endpoint alcançável por
  visitante ou adotante (incluindo favoritos, solicitações do adotante e conversas — RF-015); no painel
  aparece com os badges "Em tratamento" e "Procurando LT" e entra nos dois cards; aceita favorito e
  solicitação normalmente.
- **CA-02:** após a migration, não há linha `RESGATADO` e o enum não tem o valor; animal criado sem
  status nasce `EM_CUIDADOS`; a migration foi ensaiada no branch do Neon e aplicada em produção
  antes do merge, na ordem de virada do Modelo de dados.
- **CA-03:** animal `EM_LT` vinculado que vira `ADOTADO` — pela conclusão da solicitação **e** pelo
  select manual — termina com `NAO_SE_APLICA` e `larTemporarioId = null`.
- **CA-04:** sair de `EM_LT` zera o vínculo; `larTemporarioId` com `situacaoLT ≠ EM_LT` é rejeitado;
  `situacaoLT ≠ NAO_SE_APLICA` em animal de acolhedor ou `ADOTADO` é rejeitado.
- **CA-05:** o seletor de vínculo da aba lista só animais da própria ONG `EM_LT` sem vínculo.
- **CA-06:** excluir LT com 2 animais vinculados remove o LT definitivamente; os 2 animais ficam
  `EM_LT` sem registro e passam a contar em "Em LT sem registro".
- **CA-07:** ONG B não lista, lê, edita, exclui nem vincula LTs da ONG A (404/403); acolhedor recebe
  403 na API de LT e não vê a aba; cadastro de LT sem o checkbox de autorização é rejeitado.
- **CA-08:** com o tratamento concluído sem próxima dose, o badge e a contagem "Em tratamento" somem;
  dose pendente atrasada continua contando; um animal `ADOTADO` com dose pendente não mostra o badge,
  não entra no filtro `tratamento=1` nem no card, e o cuidado segue visível na Central de Saúde.
- **CA-09:** portão da seção 5 do `CLAUDE.md` verde (`npm test`, `tsc` nos dois apps, build do
  frontend), com testes novos cobrindo CA-03 a CA-08.

## Critério de prazo

- Entregue e testada até **06/11/2026**, deixando margem para DER, diagrama de classes, casos de uso
  e doc v21 antes da banca final de **02/12/2026**.
