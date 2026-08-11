# Specs do AdoptPlace — índice e regra de continuidade

Cada funcionalidade do projeto nasce como uma **spec numerada**. Cada spec tem, obrigatoriamente,
dois documentos:

| Arquivo | O que é | Quando se escreve |
|---|---|---|
| `spec.md` | **O que se quer e por quê.** Histórias, requisitos, critérios de sucesso, decisões e suas justificativas. | Antes de qualquer código |
| `ENTREGA.md` | **O que realmente aconteceu.** O que foi entregue, o que não foi, decisões que não se reabrem, armadilhas descobertas, onde o código vive. | Aberto junto com a spec, preenchido a cada entrega |

`spec.md` é promessa. `ENTREGA.md` é fato. **Quando os dois divergem, o `ENTREGA.md` manda** — ele
é que descreve o sistema que existe. A spec 004 é o exemplo vivo: prometeu verde oliva, entregou
teal e âmbar.

---

## Índice

| # | Spec | Estado | Registro |
|---|---|---|---|
| 001 | [Animal Adoption Management](001-animal-adoption-management/spec.md) | Entregue (2026-06-28) | [ENTREGA](001-animal-adoption-management/ENTREGA.md) |
| 002 | [Central de Saúde, Painel e Chat](002-health-dashboard-chat/spec.md) | Entregue (2026-07-23) | [ENTREGA](002-health-dashboard-chat/ENTREGA.md) |
| 003 | [Integração Backend ↔ Frontend](003-backend-frontend-integration/spec.md) | Entregue (2026-08-04) | [ENTREGA](003-backend-frontend-integration/ENTREGA.md) |
| 004 | [Reforma de UI/UX](004-ui-ux-redesign/spec.md) | Entregue (2026-08-07), acessibilidade pendente | [ENTREGA](004-ui-ux-redesign/ENTREGA.md) |
| 005 | [Feels — swipe com proximidade](005-feels/spec.md) | Entregue (2026-08-08), menos US6 | [ENTREGA](005-feels/ENTREGA.md) |
| 006 | [Perfis públicos e busca por nome](006-perfis-publicos/spec.md) | **Em andamento** | [ENTREGA](006-perfis-publicos/ENTREGA.md) · [HANDOFF](006-perfis-publicos/HANDOFF.md) |

**Para retomar o projeto numa sessão de IA nova** — inclusive de outro sistema — use
[`PROMPT-CONTINUIDADE.md`](PROMPT-CONTINUIDADE.md): traz um modelo reutilizável para qualquer spec
e uma instância pronta da 006.

---

## Regra de continuidade (obrigatória)

**Antes de escrever a primeira linha de código de uma spec N, leia o `ENTREGA.md` da spec N-1.**
Se depois disso ainda restar dúvida sobre por que o sistema é como é, leia também o da **N-2**.

Não é burocracia. Nesta base, cada spec herdou decisões da anterior que **não estão no código** e
que custam caro para redescobrir:

- A **005** reverteu a estratégia de geolocalização inteira depois de medir. Quem for mexer em
  distância sem ler a 005 vai reintroduzir chamada de API no caminho de leitura.
- A **004** trocou a paleta da própria spec depois de uma reversão completa. Quem ler só a
  `spec.md` da 004 vai aplicar verde oliva num sistema teal.
- A **003** definiu que a raiz é service-only e que `legacy/` não se toca. Quem não ler vai editar
  o frontend morto.
- A **001** definiu os estados canônicos e a regra de recusa automática. Quem não ler vai inventar
  um estado novo.

**Duas para trás é o piso, não o teto.** O que se exige de fato é entender **tudo que já foi
entregue até aqui** — o índice acima existe para tornar isso barato. Em caso de dúvida entre o que
uma spec antiga prometeu e o que o código faz hoje, a ordem de autoridade é:

> **código real > `ENTREGA.md` > `CLAUDE.md` > `spec.md`**

E o `CLAUDE.md` continua sendo leitura obrigatória antes de tudo.

---

## Abrindo a próxima spec

1. Criar `specs/00N-nome-curto/spec.md` com o que se quer e por quê, incluindo as *Clarifications*
   — as perguntas decididas e a justificativa de cada uma.
2. Criar `specs/00N-nome-curto/ENTREGA.md` **já no início**, a partir do modelo abaixo, com o
   estado `EM ANDAMENTO` e as ondas em aberto.
3. Ler o `ENTREGA.md` da spec anterior (e da anterior a ela, se necessário).
4. Abrir a branch `00N-nome-curto`. Nunca trabalhar direto na `main`.
5. A cada onda concluída: preencher a linha correspondente no `ENTREGA.md`, com o commit.
6. Ao fechar a branch: preencher "o que não foi entregue" e "onde o código vive", e trocar o estado
   para `Entregue`.
7. Atualizar o índice acima e a seção 10 do `CLAUDE.md`.

### Modelo de `ENTREGA.md`

```markdown
# Entrega — Spec 00N: <nome>

| | |
|---|---|
| **Período** | <início> → <fim> |
| **Branch** | `00N-nome-curto` |
| **PRs** | #… |
| **Status** | EM ANDAMENTO / Entregue / Entregue parcialmente |
| **Spec** | [`spec.md`](spec.md) |

## 1. O que a spec promete
Tabela de histórias, prioridade e estado.

## 2. O que foi entregue
Por onda ou por fatia, com o hash do commit. Sem hash, não é registro — é lembrança.

## 3. Decisões que não se reabrem
Cada uma com o motivo. Este é o item que mais economiza tempo de quem vem depois.

## 4. O que a spec previa e não foi entregue
Dívida explícita. Silêncio aqui vira retrabalho na spec seguinte.

## 5. Armadilhas descobertas
O que enganou, e como reconhecer o sintoma da próxima vez.

## 6. Onde o código vive
Caminhos reais de arquivo, backend e frontend.

## 7. Para quem vier depois
O que a próxima spec precisa saber desta.
```
