# Implementation Plan: Reforma de UI/UX do AdoptPlace

**Branch**: `004-ui-ux-redesign` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

## Summary

Reformar a apresentação do frontend oficial para tornar jornadas públicas e protegidas responsivas, acessíveis e consistentes, preservando integralmente o comportamento certificado na feature 003. O trabalho começa por baseline renderizada e padrões reutilizáveis, depois migra jornadas em ondas dependentes. Não muda persistência, contratos, autenticação, permissões ou regras.

## Technical Context

**Language/Version**: TypeScript strict; frontend React/TanStack Start/Router/Vite em `frontend/`; backend Next.js 15 na raiz.
**Primary Dependencies**: Tailwind, Radix/shadcn, Lucide, React Query, React Hook Form, Zod e Uploadthing já existentes.
**Storage**: nenhuma mudança; PostgreSQL/Prisma continua exclusivo do backend.
**Testing**: Vitest da raiz; typecheck/lint/build da raiz; build do frontend; testes focados de UI; roteiro manual por papel.
**Target Platform**: navegador desktop e mobile, com viewport 375, 1024 e 1440 px.
**Project Type**: duas aplicações: frontend público TanStack e backend/service Next.js.
**Performance Goals**: preservar respostas e contratos atuais; loading visual deve reservar estrutura equivalente ao resultado final.
**Constraints**: WCAG 2.2 AA; teclado, zoom 200%, sem rolagem horizontal; oliva primário; dados e imagens reais; nenhum endpoint/dependência novo.
**Scale/Scope**: shells, primitives, rotas públicas e protegidas existentes em `frontend/src/routes/`.

## Constitution Check

**Pré-pesquisa: PASS. Pós-design: PASS.** A constituição 1.2.0 reconhece explicitamente o frontend TanStack e o backend Next.js por contratos HTTP.

- **Zero over-engineering**: padrões novos só serão compartilhados quando atendem duas ou mais jornadas; nenhum service layer ou design system paralelo.
- **Schema first**: nenhuma entidade, schema, migration, seed ou Prisma Client é alterado.
- **Server-side/security/validation**: contratos, sessão, autorização, regras e Zod confiável permanecem no backend; frontend apenas apresenta e chama contratos existentes.
- **Minimal client state**: somente foco, menu, diálogo, filtro e estado visual transitório.
- **Dependencies/strict/test-first**: nenhuma dependência; TypeScript strict preservado. Testes test-first continuam exigidos se uma mudança atingir comportamento confiável, o que não é previsto.

## Inventory and Structure

| Área existente | Evidência | Uso planejado |
|---|---|---|
| Tokens | `frontend/src/styles.css` | expandir tokens semânticos, foco e superfícies sem trocar a primária oliva |
| Primitives | `frontend/src/components/ui/` | reutilizar Button, Dialog, Sheet/Drawer se presentes, Select, Badge, Card |
| Compartilhados | `components/app/{Navbar,EmptyState,PublicAnimalCard,AnimalFilters,StatusBadge}.tsx` | consolidar shell, estados e cards |
| Shells | `routes/__root.tsx`, `_authenticated.dashboard.tsx`, `_authenticated.tsx` | navegação global, dashboard e foco |
| Rotas | `routeTree.gen.ts` | fonte de destinos, não criar rotas nem migrá-las |
| Contratos | `specs/003.../contracts/http-contract-inventory.md` | regressão de DTO, sessão, privacidade e Uploadthing |

```text
frontend/src/
|-- styles.css
|-- components/{ui,app}/
|-- routes/                         # TanStack, fonte das telas
`-- lib/{data,domain}/               # contratos existentes, sem mudança de domínio
app/api/, lib/, prisma/              # backend existente; fora de alteração funcional
specs/004-ui-ux-redesign/
|-- plan.md research.md quickstart.md data-model.md
`-- contracts/ui-patterns.md
```

**Structure Decision**: implementar somente no frontend oficial e seus testes. `legacy/frontend-antigo/` não entra no escopo; raiz é lida apenas para preservar contratos.

## Gates and Implementation Waves

| Onda | Escopo / dono principal | Gate de entrada | Gate de saída / rollback |
|---|---|---|---|
| 0. Baseline | Pedro: capturas comparáveis, matriz por papel | ambiente e contas autorizadas | 375/1024/1440 antes armazenados sem segredos; sem baseline, não iniciar visual. Remover apenas capturas da onda se inválidas |
| 1. Fundação | Arthur: tokens, foco, recipes | baseline concluída | contraste/foco aprovados e primitives estáveis. Rollback: reverter só tokens/primitives da onda |
| 2. Navegação/shells | Arthur: Navbar e dashboard shell | onda 1 estável | destinos por papel e teclado nos 3 tamanhos. Rollback: restaurar shell anterior sem tocar rotas |
| 3. Estados/segurança | Arthur: loading, vazio, erro, confirmação | ondas 1–2 estáveis | cancelamento não muta, foco restaura, estado reutilizável aprovado. Rollback: por componente compartilhado |
| 4. Público | Arthur: home, vitrine, detalhe/card/filtros | ondas 1–3 estáveis | skeleton, vazio, placeholder real/neutral e contrato público sem diff. Rollback: por rota |
| 5. Adotante | Arthur: perfil, triagem, favoritos, solicitações, mensagens | ondas 1–3 estáveis | regressão do papel adotante e responsividade. Rollback: por rota/jornada |
| 6. Responsável | Arthur: animais, solicitações, saúde, documentos, mensagens | ondas 1–3 estáveis | Uploadthing e fluxos owner-scoped preservados. Rollback: por rota/jornada |
| 7. Admin/denso | Arthur: usuários e listas | padrões de lista/confirmados estáveis | dados/estado/ação acessíveis desktop/mobile, sem endpoint novo. Rollback: rota admin |
| 8. QA/polimento | Pedro: AA, regressão, homologação | ondas 4–7 concluídas | matriz de aceites completa e comparação antes/depois. Rollback: reverter onda causadora, nunca contrato |

Nenhuma jornada começa antes de seus padrões compartilhados concluírem. Pedro revisa critérios, acessibilidade, regressão e integração; Arthur é dono de componentes/layouts. `styles.css`, Navbar, shell e primitives têm dono único (Arthur) por onda.

## Validation Strategy

**Automatizada existente:** o `vitest.config.ts` coleta exclusivamente `__tests__/**/*.test.ts` em ambiente Node. `npm test` continua sendo a regressão automatizada para contratos, schemas, regras de servidor e lógica pura já suportada; esta feature não adiciona testes de componente React que o comando oficial não coleta.

**Estática e build:** executar `npm run typecheck`, `npm run lint`, `npm run prisma:validate`, `npm run build`, `npm --prefix frontend run build` e lint focado nos arquivos alterados. O lint integral do frontend possui débito CRLF/Prettier preexistente; registrar esse resultado sem reformatar arquivos não tocados.

**Homologação visual/manual:** a matriz de `quickstart.md` cobre 100% da população principal, com visitante, adotante, organização, acolhedor independente e administrador em sessões/evidências distintas. Registrar mesma rota, papel, dado, viewport (375/1024/1440), zoom, estado, data e caminho de evidência antes/depois. Avaliar teclado, foco, diálogo, 200% de zoom, alvos WCAG 2.5.8, combinações semânticas de contraste e leitor de tela para os fluxos nomeados. Quando leitor não estiver disponível, registrar indisponibilidade, revisar semântica/ARIA e manter pendência assistiva explícita.

**Limitação e nova infraestrutura:** não há infraestrutura reutilizável para renderização React, CSS, viewport, teclado ou diálogos. Uma proposta futura só pode incluir jsdom, Testing Library ou equivalente após demonstrar insuficiência do procedimento manual, documentar custo, benefício, dependências e obter aprovação; não é parte deste plano.

## Compatibility and Rollback

Não alterar assinaturas de `frontend/src/lib/data`, URLs, DTOs, guards, Uploadthing, query keys nem regras. Toda onda deve revisar rede/contratos e executar jornada homologada correspondente. Rollback é revert de commit/PR da onda em `frontend/`; não envolve banco, cache persistido, contratos ou backend.

## Ownership Matrix

| Frente | Principal | Revisor | Arquivos compartilhados / estratégia |
|---|---|---|---|
| Spec, rastreabilidade, Issues, aceite, QA | Pedro | Arthur | não editar UI em paralelo |
| Tokens/primitives/foco | Arthur | Pedro | dono único de `styles.css` e `components/ui` |
| Navbar e shells | Arthur | Pedro | dono único de Navbar/root/dashboard shell por onda |
| Estados e confirmação | Arthur | Pedro | componentes primeiro, migradores só consomem |
| Rotas públicas/adotante/responsável/admin | Arthur | Pedro | uma rota por PR; paralelo só em arquivos distintos |
| Homologação e integração | Pedro | Arthur | matriz de evidências, sem reescrever telas |

## Complexity Tracking

Nenhuma violação constitucional ou dependência nova prevista.
