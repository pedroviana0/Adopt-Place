# Entrega — Spec 003: Integração Backend ↔ Frontend

| | |
|---|---|
| **Período** | 2026-07-23 → 2026-08-04 |
| **Branch** | `003-backend-frontend-integration` |
| **PRs** | #70 a #95 (mais de 20 PRs pequenos) |
| **Status** | **Entregue e homologada** |
| **Spec** | [`spec.md`](spec.md) · **matriz**: [`integration-matrix.md`](integration-matrix.md) |

> **Esta é a spec que define a arquitetura atual.** Ela trocou o frontend, definiu que a raiz é
> service-only e estabeleceu que o backend é a fonte da verdade dos contratos. Qualquer dúvida
> sobre "quem fala com quem" se resolve aqui.

---

## 1. O que a spec prometia

Integrar o frontend oficial vindo do Lovable (`frontend/`) ao backend real da raiz. A exigência
central, registrada nas Clarifications, é contraintuitiva e foi deliberada: **a primeira entrega
deveria ser auditoria, matriz e inventário de contratos — não implementação.**

| | História | Prioridade |
|---|---|---|
| US1 | Auditar o encaixe entre frontend e backend | P1 |
| US2 | Integrar autenticação e perfis reais em fatias verificáveis | P1 |
| US3 | Substituir dados simulados por fluxos reais de adoção | P2 |
| US4 | Validar Saúde, dashboard e chat contra a feature 002 | P2 |
| US5 | Desativar interfaces concorrentes sem perder histórico | P3 |

**Definição de pronto por fluxo** (SC-002/SC-003): contrato HTTP documentado, backend implementado
e validado, frontend consumindo dado real, mocks e `localStorage` daquele fluxo removidos, e
critérios de aceite passando. A matriz distingue: *auditado → contrato definido → backend pronto →
frontend integrado → fluxo concluído*.

## 2. O que foi entregue

**Preparação do terreno:** frontend oficial importado (`63273c3`), frontend antigo arquivado em
`legacy/` (`f5aeeec`), validações da raiz isoladas (`4a6f55a`).

**Auditoria primeiro, como prometido:** baseline (`e95451d`), evidência na matriz (`10d7ad3`),
mapa de fluxos (`19a107c`), lacunas frontend-only (`c779013`), inventário HTTP fechado (`a3934ad`).

**Depois, a integração em fatias** — cada uma com contrato antes de tela:

| Fluxo | Backend | Frontend |
|---|---|---|
| Sessão e autenticação | `c932049` (`/api/session`) | `39dc3f4` (remove `localStorage`) |
| Vitrine pública | `a47757d` | `f3bfd0b` |
| Cadastro, perfil e triagem | `5582267` | `5df8b99` |
| Jornada do adotante | `87ea974` | `d575280` |
| Gestão de animais | `56d350a` | `249ecf2` |
| Fotos (UploadThing) | `d496d90`, `449334c` | idem |
| Solicitações do responsável | `5ebf795` | `52851db` |
| Central de Saúde | `5ab6757` | `3933061` |
| Dashboard operacional | `f26b35a` | `35d0402` |
| Documentos de saúde | `f26b35a` | `b59504d` |
| Chat da adoção | `f26b35a` | `e000276` |
| Administração de usuários | `7375ed4` | `4e40b37` |

**Auditoria de rotas:** `ddabc37` corrigiu o defeito **F1**; `a5a062a` registrou a raiz como
service-only; `64946e1` certificou T031–T034.

## 3. Decisões que não se reabrem

1. **A raiz é backend/serviço, e só.** Suas telas não são interface pública. `frontend/` é a única
   interface oficial. Não existem duas interfaces concorrentes.
2. **O backend é a única camada autorizada a tocar Prisma e PostgreSQL.**
3. **O backend é a fonte da verdade dos contratos.** Antes de consumir um endpoint no frontend,
   leia o `route.ts` e o schema real. Nunca inventar endpoint, campo ou enum.
4. **Mesma origem ou proxy reverso**, para o cookie de sessão ficar first-party. Em dev é o proxy
   do Vite (`frontend/vite.config.ts` → `:3000`); em produção é o rewrite `/api` da Vercel.
5. **`legacy/` não se usa e não se edita.**
6. **Um fluxo só é "concluído" quando os mocks daquele fluxo morreram.** Meio-integrado é
   "frontend integrado", não "concluído".

## 4. O que mudou depois da entrega

A spec registra a divisão "Arthur/Claude no frontend, Pedro/Codex no backend, matriz como ponto de
sincronização". **Essa divisão acabou** — ver `CLAUDE.md`, §2. A matriz continua válida como
registro de estado; a divisão de trabalho descrita nela, não.

## 5. Armadilhas que nasceram aqui

- **Defeito F3 da ROUTES-01 (papel errado) segue aberto.** Quando alguém entra numa rota que não
  corresponde ao seu papel, a aplicação redireciona em silêncio em vez de explicar. Foi resolvido
  **apenas em `/feels`** (spec 005, commit `113ac43`); **as demais rotas ainda têm o defeito.**
- **SSR real de sessão está fora de escopo** por decisão registrada.

## 6. Onde o código vive

`app/api/**` (todos os contratos) · `lib/api/*-http.ts` e `*-context.ts` (helpers de autorização) ·
`frontend/src/lib/data/*.ts` (camada que fala com `/api`) · `legacy/` (arquivo morto)

## 7. Para quem vier depois

A `integration-matrix.md` é o documento vivo de estado desta base. Antes de afirmar que um fluxo
"já existe", confirme na matriz **e** no `route.ts` correspondente.
