# Entrega — Spec 004: Reforma de UI/UX

| | |
|---|---|
| **Período** | 2026-08-05 → 2026-08-07 |
| **Branches** | `004-ui-ux-redesign`, `004-99-baseline-visual`, `004-100-tokens-focus`, `004-101-mobile-navigation`, `004-paleta-tipografia`, `004-teal-amber-redesign`, `004-login-glass` |
| **PRs** | #96, #97, #111, #112, #113, #114, **#115 (revert)**, #117, #118 |
| **Status** | **Entregue**, com a homologação manual de acessibilidade **ainda pendente** (§4) |
| **Spec** | [`spec.md`](spec.md) · plano em [`plan.md`](plan.md) · tarefas em [`tasks.md`](tasks.md) |

> **A identidade visual entregue não é a que a spec descreve.** A spec fixou **verde oliva** como
> primária. O que está no ar é **teal & âmbar**. A troca foi deliberada e passou por uma reversão
> completa no caminho. Leia a §3 antes de tocar em cor nesta base.

---

## 1. O que a spec prometia

Reforma de UI/UX **sem mudança funcional**: sem migrar telas, contratos ou regras, e sem ampliar
o backend para a reforma.

| | História | Prioridade |
|---|---|---|
| US1 | Navegar por qualquer dispositivo | P1 |
| US2 | Executar ações com feedback e segurança | P1 |
| US3 | Descobrir animais com clareza | P2 |
| US4 | Usar jornadas autenticadas em contexto operacional | P2 |
| US5 | Perceber interface consistente e acessível | P3 |

Nove critérios de sucesso, ancorados em **375 px, 1024 px, 1440 px e 200% de zoom**, foco visível
por teclado, confirmação em ação destrutiva, e **WCAG 2.2 AA** com significado nunca comunicado só
por cor. A spec exigiu **baseline renderizada antes da primeira alteração visual** — porque a
auditoria original era estática e isso foi considerado insuficiente.

## 2. O que foi entregue

- **Baseline visual** antes de mexer (`e2d3120`), como a spec exigia.
- **Fundação** (`c8c284a`) — tokens semânticos e foco.
- **Navegação** — menu mobile acessível por papel (`f41d448`), shell do dashboard (`cefafee`),
  ícones no menu de perfil (`74f2b25`).
- **Padrões transversais** (`27bb00a`) — estados assíncronos e confirmações seguras
  (`AsyncState.tsx`, `ConfirmDestructiveAction.tsx`).
- **Telas** — descoberta pública (`ebf4c05`), jornadas do adotante (`150cca8`), gestão de animais
  (`7b1b4ab`), solicitações/saúde/documentos (`5857f47`), mensagens (`5b0f158`, `b39b61c`),
  administração (`a4c278e`).
- **Portões de regressão** documentados (`2450d31`).

**Identidade, em três atos:**

1. `d533d53` (PR #114) — identidade "vibrante": Playfair, DM Sans, Jade Sky, glass.
2. `6ce4ec4` (PR #115) — **revertida inteira.** É o marco divisor da governança: depois do #115, o
   mantenedor assumiu a criação de todas as funcionalidades.
3. `0612c9d` (PR #117) — **Teal & Amber** sobre o redesign 004. Depois: login Glass (`0dad02f`,
   PR #118), navbar liquid-glass (`f930d08`), logo oficial (`14eaa93`, `0c7c5b7`), hero da home
   (`faf5665`, `25bf312`) e fundo contínuo `page-canvas` (`c94e37b`).

## 3. Decisões que não se reabrem

1. **Teal & âmbar substituiu o verde oliva.** Primária teal `oklch(0.511 0.086 186.4)`, acento
   âmbar `oklch(0.769 0.165 70.1)`, mais o **âmbar de marca** (`--brand`, o laranja da logo). A
   direção atual é **refinar** teal/âmbar, não repensar.
2. **Vidro é acento, não regra.** Cards, overlays e topbar sobre imagem ou profundidade. Texto
   sempre legível, contraste AA.
3. **`page-canvas`: o fundo é da página, nunca por seção.** Aplicar no container raiz da rota e
   deixar as seções transparentes, sem `border-b`. Fundo por seção cria degrau visível entre
   blocos — erro real, corrigido em `c94e37b`.
4. **Navbar sólida no topo, vidro após o primeiro scroll.** O blur fica sempre aplicado e só a
   opacidade transiciona: animar `backdrop-filter` a partir de `none` trava em `blur(0px)`.
5. **Alpha em cor exige token próprio.** O modificador `/opacidade` do Tailwind sobre token em
   `var()` (ex.: `bg-background/60`) **não emite alpha** aqui. Padrão: criar token explícito, como
   os `--canvas-wash-*` e `--navbar-glass`.
6. **Sem cor hardcoded.** Só token semântico.

## 4. O que a spec previa e não foi entregue

- **A homologação manual de acessibilidade continua pendente:** navegação por teclado, zoom 200% e
  contraste AA. Os blockers foram registrados em `fdecfa1` e a lacuna segue aberta no `CLAUDE.md`,
  §10. **Nenhum critério de SC-001 a SC-003 e SC-007 foi verificado a mão.**
- A spec pedia comparação posterior à baseline em 375/1024/1440 px. A baseline foi capturada; a
  comparação sistemática, não.

## 5. Armadilhas que nasceram aqui

- **`routeTree.gen.ts` é gerado.** Se o build regenerar e você **não** criou rota, reverta. Se
  criou, commite.
- **ESLint acusa `Delete ␍` em quase todo arquivo** por causa do `autocrlf` no Windows. É artefato
  do working tree, não erro de código. Não corrigir em massa.
- **Reverter é uma opção legítima.** O #115 provou que reverter inteiro e recomeçar custou menos
  que emendar uma direção visual errada.

## 6. Onde o código vive

`frontend/src/styles.css` (tokens, `@font-face`) · `frontend/src/components/ui/` (shadcn +
`glass-card.tsx`) · `frontend/src/components/app/` (`Navbar`, `AsyncState`,
`ConfirmDestructiveAction`, `Logo`) · `frontend/public/fonts/`, `frontend/public/logo.png`

## 7. Para quem vier depois

Toda rota nova — e a spec 006 cria várias — nasce devendo os mesmos critérios: `page-canvas` no
container raiz, token semântico, foco visível, e **sem rolagem horizontal em 375/1024/1440 px nem a
200%**. A 006 repete isso no NFR-001 e no SC-007 justamente porque a dívida da 004 ainda está
aberta.
