# Spec 009 — Lar temporário e reforma do status: brief para a sabatina (grilling)

Este arquivo é o ponto de partida da sessão de `grilling`. Ele traz o que **já foi decidido**
(rodada 1, aceita por Pedro em 14/10/2026), o que **ainda está aberto** e as **restrições**
do projeto. A sabatina não reabre o que está em "Decidido", a não ser que encontre uma
contradição concreta no código — nesse caso, aponte a contradição e pergunte.

Antes de começar, leia: `specs/README.md` (regra de continuidade), `specs/008-correcoes-upload-triagem/ENTREGA.md`,
`prisma/schema.prisma` (models `Animal`, `Organizacao`, `AcolhedorIndependente`, `CuidadoPlanejado`,
enum `StatusAnimal`) e `CLAUDE.md`.

---

## Origem

Feedback do Luiz (Cia Animal VR — Grupo de Proteção Animal VR) durante a validação do sistema:

- Pediu as opções "Em lar temporário" e "Procurando lar temporário" (sigla usada pelas ONGs: **LT**).
- Achou o status **Resgatado** redundante: todo animal na plataforma foi resgatado.
- Caso **Seninha**: está na clínica tomando antibiótico (em cuidados), mas já pode ser adotado
  (o adotante continua o antibiótico em casa) e também precisa de LT. Hoje o sistema não
  consegue representar isso, porque `status` é um campo único.
- Sugeriu diferenciar "disponível para adoção" de "disponível para LT e adoção": um animal que
  já está em LT só precisa de adoção; um que não tem LT precisa das duas coisas.

Diagnóstico: o campo `status` guarda três informações diferentes — **etapa da adoção**,
**saúde** e **lar temporário**. A spec separa essas três informações.

## Decidido (rodada 1)

| # | Decisão |
|---|---|
| D1 | **Remover `RESGATADO`** de `StatusAnimal`. Migration converte as linhas existentes para `EM_CUIDADOS`; o `@default` passa a ser `EM_CUIDADOS`. O sistema já está em produção (demo e validação, Neon), então a migration converte dados reais e deve ser testada no branch de validação antes. |
| D2 | **`EM_CUIDADOS` passa a significar "ainda não anunciado"** (animal muito doente ou em preparação, fora da vitrine). Status continua campo único. Animal em tratamento que já pode ser adotado fica `DISPONIVEL`. |
| D3 | **"Em tratamento" é um indicador derivado**, sem coluna nova: aparece quando o animal tem `CuidadoPlanejado` do tipo `MEDICAMENTO_TRATAMENTO` pendente. Segue a regra das tags (derivadas na renderização). |
| D4 | O indicador "Em tratamento" aparece **só no painel** nesta spec. |
| D5 | Novo campo **`situacaoLT`** no `Animal`, independente do status: `NAO_SE_APLICA` (padrão) · `PROCURANDO` · `EM_LT`. Editável em `EM_CUIDADOS`, `DISPONIVEL` e `EM_PROCESSO_ADOCAO`; volta automaticamente para `NAO_SE_APLICA` (e desvincula o LT) quando o animal vira `ADOTADO`. |
| D6 | **Só Organização** tem o campo e a aba de LT. Acolhedor independente já é, por definição, o LT do animal. |
| D7 | **Nada de LT na vitrine**, no card público, no Feels ou no perfil público. É funcionalidade de gestão, porque nem toda ONG usa LT. "Divulgar pedidos de LT publicamente" vai para trabalhos futuros do TCC. |
| D8 | Nova entidade **`LarTemporario`**, pertencente à Organização. `Animal.larTemporarioId` opcional; só pode ser preenchido quando `situacaoLT = EM_LT`. Um animal fica em um LT por vez; **sem histórico** de passagens. Um animal pode estar `EM_LT` sem LT vinculado (registrado no sistema depois). |
| D9 | Prazo: spec entregue e testada até o **início de novembro de 2026**; depois disso, atualizar DER, diagrama de classes, casos de uso e doc (v21), tudo congelado antes da banca final (02/12/2026). Alinhar com o Arthur (mantenedor) antes de implementar. |

### Funcionamento esperado da aba "Lares temporários" (palavras do Pedro)

- Aba nova no painel de gestão da Organização.
- A ONG cadastra o LT (nome do tutor temporário, endereço, telefone e demais dados do formulário da Cia Animal).
- A ONG vincula animais ao LT. **Só aparecem para vínculo os animais marcados `EM_LT` e ainda sem LT vinculado.**
- Serve também para organização: ver no painel quais animais já estão em LT e quais precisam.

## Aberto — a sabatina deve resolver

Ordem sugerida da árvore de decisões (o grilling recalcula a fronteira a cada rodada):

1. **Campos do `LarTemporario`.** Depende do formulário que o Luiz vai enviar. Se ainda não chegou,
   propor um conjunto mínimo (nome, telefone, endereço/cidade, observações) e marcar como provisório.
   Avaliar: CPF? capacidade? espécies aceitas? data de início?
2. **LGPD.** Dados pessoais de quem não tem conta na plataforma: base legal, quem vê (só a própria
   ONG), o que acontece ao excluir o LT ou a ONG.
3. **Ciclo de vida do vínculo.** Ao trocar `situacaoLT` de `EM_LT` para outra, desvincula sozinho?
   Excluir LT com animais vinculados: bloquear ou desvincular? Editar LT? Desativar em vez de excluir?
4. **UX do formulário do animal.** Onde fica o select de LT (ao lado do Status?), se pode escolher o
   LT direto no formulário do animal ou só pela aba, e como o status "Em cuidados" é explicado
   ("ainda não anunciado") para não confundir.
5. **Painel/dashboard.** Contagens novas (procurando LT, em LT sem vínculo, em tratamento)? Filtros
   em "Meus animais" por `situacaoLT` e "em tratamento"?
6. **Indicador "Em tratamento".** Confirmar a regra exata de derivação (pendente com data futura?
   pendente vencido também conta?) e onde aparece (lista, detalhe, card do painel).
7. **Migration.** Ordem segura no PostgreSQL para remover valor de enum (criar enum novo, converter,
   trocar), impacto nos testes que citam `RESGATADO`, frontend (`StatusBadge`, `enums.ts`,
   `schemas/animal.ts`), seed e o fluxo de publicação (`AnimalForm` cria como `EM_CUIDADOS`).
8. **Fora de escopo explícito.** Listar o que não entra (ex.: galeria pública de adotados, pedido de LT
   pela plataforma, histórico de LTs, LT para acolhedor independente).
9. **Critérios de aceitação.** Incluir o caso Seninha: `DISPONIVEL` + em tratamento + `PROCURANDO`
   aparece na vitrine normalmente, sem nenhum sinal de LT, e aparece no painel com os indicadores.

Pendências com o Luiz (não bloqueiam a sabatina, mas devem constar no spec.md):
- Formulário de LT da Cia Animal (define os campos).
- Confirmação de que LT fica só na gestão.
- Se um animal pode precisar de LT sem estar disponível para adoção (o modelo já permite).

## Restrições do projeto

- Stack: Next.js 15 App Router + Prisma 5 + PostgreSQL (backend em `app/`, `lib/`) e frontend
  TanStack em `frontend/`. Seguir `CLAUDE.md` e `.specify/memory/constitution.md`.
- Regra XOR do responsável: animal tem `organizacaoId` **ou** `acolhedorId`.
- `DISPONIVEL` é o único status público (vitrine, Feels, favoritos, solicitações, perfil público).
  Essa spec **não muda** isso.
- `tasks.md` é editado só pelo Pedro manualmente — nenhum agente escreve nesse arquivo.
- Ambiente: Windows + PowerShell.

## Saída esperada da sessão

Quando a fronteira estiver vazia e o Pedro confirmar o entendimento compartilhado, escreva:

1. `specs/009-lar-temporario-status/spec.md` no padrão das specs anteriores (Objetivo, Contexto/origem,
   Decisões com justificativa, Requisitos funcionais numerados, Modelo de dados, Fora de escopo,
   Pendências externas, Critérios de sucesso/aceitação).
2. `specs/009-lar-temporario-status/ENTREGA.md` só com o cabeçalho e "Ainda não iniciado".
3. Uma linha nova no índice de `specs/README.md` (009, "Em especificação").

Não escreva código, migration nem `plan.md`/`tasks.md` nesta sessão.
