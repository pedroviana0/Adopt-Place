# AdoptPlace — Harness do Projeto (contexto canônico p/ IA)

> **Este é o arquivo-fonte de contexto do projeto.** Leia-o inteiro antes de qualquer tarefa.
> Ele define o produto, a arquitetura, as fronteiras de escopo e os guardrails que a IA
> deve respeitar. Substitui o modelo de governança antigo (`ARTHUR-CONTEXT.md`, histórico).
> _Atualizado: 2026-08-07._

---

## 1. O produto

**AdoptPlace** conecta animais resgatados a famílias que querem adotar, na região de
**Volta Redonda/RJ**. Três públicos: **adotantes**, **ONGs/organizações** e **acolhedores
independentes**. Funções já prontas: vitrine pública de animais, cadastro/triagem do adotante,
favoritos, solicitações de adoção, gestão de animais (CRUD + fotos), central de saúde,
documentos, dashboard e chat. É um **TCC (IFRJ Pinheiral, 2026)** — apresentação em ~dez/2026.

**Meta de produto:** sistema **funcionando e no ar** (deploy real), não só rodando local.

---

## 2. Papel, dono e governança

- **Dono único: o mantenedor** (conta GitHub `thurreis7`). O antigo split "Arthur=frontend /
  Pedro=backend" **acabou** — o Pedro saiu (sem acesso ao Codex, viajando). A IA agora atua em
  **frontend e backend**, sempre sob direção do mantenedor no chat.
- **Fluxo de merge: commit direto na `main`** (sem PR obrigatório) — decisão do mantenedor para
  agilidade, já que é dev solo. **Em troca, o portão automático da seção 5 é obrigatório** e faz
  o papel da revisão perdida: nada vai pra `main` sem `tsc` + `build` limpos.
- **Ações "pra fora" (deploy, publicar, mexer em conta/segredo) exigem confirmação** do mantenedor
  no chat. A IA **não cria contas nem digita credenciais/segredos** — prepara tudo e o mantenedor
  executa essa parte.
- **Autoria:** commits como `thurreis7`, com trailer `Co-Authored-By: Claude`.

---

## 3. Arquitetura (mantida — sem refactor durante o TCC)

Dois apps no mesmo repositório, com fronteira clara:

| Camada | Onde | Stack |
|---|---|---|
| **Backend** | `app/api/**`, `lib/` (queries/schemas Zod), `prisma/` | Next.js App Router, NextAuth, uploadthing, Prisma/PostgreSQL |
| **Frontend** | `frontend/` (app próprio, `package.json` próprio) | Vite + TanStack Start (SSR via nitro, alvo **Cloudflare**), Tailwind v4, shadcn |

- **Contrato entre eles:** o frontend chama `/api/*`; em dev, `frontend/vite.config.ts` faz
  **proxy** de `/api` → `http://localhost:3000` (backend), pra cookie de auth ficar first-party.
- **O backend é a fonte da verdade dos contratos.** Antes de consumir um endpoint no frontend,
  leia o `route.ts` + schema/queries reais em `lib/`. Nunca inventar endpoint/campo/enum.
- **`legacy/`** = frontend antigo. **Não usar, não editar.**
- **Decisão registrada:** manter o split e **manter o Prisma** (é só o ORM; não é o que gera
  custo). Convergir num app só é refactor "pós-TCC", fora de escopo agora.

---

## 4. Mapa de pastas (e o que NÃO tocar)

```
app/                 Backend Next.js (rotas de API, páginas legadas do backend)
  api/**             Endpoints — fonte da verdade dos contratos
lib/                 Queries, schemas (Zod), auth, integrações            [backend]
prisma/              schema.prisma (22 models), migrations                [backend]
__tests__/           Testes de backend (Vitest, mockam o Prisma)          [backend]
frontend/            App de UI (Vite + TanStack Start)
  src/routes/        Rotas/páginas (file-based). routeTree.gen.ts é GERADO
  src/components/ui/ Componentes shadcn (button, input, glass-card, …)
  src/components/app/ Componentes de produto (Navbar, cards, mensagens…)
  src/lib/data/      Camada que fala com /api (sessao, animais, favoritos…)
  src/styles.css     Tokens de tema (Teal & Amber) + @font-face
  public/fonts/      Fontes self-hospedadas (Inter, Poppins)
specs/               Spec-kit (spec→plan→tasks) das features 001–004
CLAUDE.md            ESTE arquivo (harness canônico)
```

**Nunca editar sem pedido explícito:** `legacy/`, `frontend/src/routeTree.gen.ts` (gerado),
arquivos `.env` / segredos, migrations já aplicadas.

---

## 5. Portão de qualidade (OBRIGATÓRIO antes de todo commit)

Como não há PR/revisão, isto é a rede de segurança. Rodar em `frontend/` para mudanças de UI:

```bash
cd frontend
npx tsc --noEmit          # type-check — precisa passar
npm run build             # build — precisa passar
```

- **`routeTree.gen.ts`:** se o build regenerar **e você NÃO adicionou rota nova**, **reverter**
  (`git checkout -- frontend/src/routeTree.gen.ts`). Se **adicionou** rota, **commitar** o arquivo.
- **ESLint/CRLF:** o `eslint` local acusa `Delete ␍` em quase todo arquivo por causa do
  `core.autocrlf=true` (Windows). É artefato do working tree — o conteúdo versionado é LF/limpo.
  Não "consertar" isso em massa; focar só em erros reais de código.
- Backend: testes com `npm test` (Vitest mocka o Prisma, roda sem banco).

---

## 6. Dados & Prisma

- PostgreSQL via Prisma (`DATABASE_URL`). Provider-agnóstico: funciona com qualquer Postgres.
- **Host recomendado (custo zero):** **Neon** — grátis e **acorda sozinho** ao conectar (evita o
  problema do Supabase free, que **pausa após ~7 dias** parado e exige despausar no painel).
- Migrar host = trocar `DATABASE_URL` (sem mexer em código).
- **Nunca** rodar seed/reset/migration destrutivo contra o banco de produção. Dados de teste só
  em ambiente de homologação/local.

---

## 7. Deploy (requisito: sistema no ar, custo zero)

Stack alvo, tudo em plano grátis:

**Decisão (2026-08-07): tudo na Vercel** (backend + frontend na mesma plataforma/origem).

| Peça | Serviço grátis | Observação |
|---|---|---|
| Banco | **Neon** (provisionado, sa-east-1) | Postgres, auto-resume; mesma URL serve local e prod |
| Backend (Next) | **Vercel** (Hobby) | roda API + NextAuth + Prisma |
| Frontend (Vite/TanStack) | **Vercel** (preset nitro `vercel`) | rewrite `/api/*` → backend, mesma origem |

- **Mesma origem resolve o auth:** front e back em origens diferentes quebram o cookie
  first-party (em dev é o proxy do Vite). Em produção, o rewrite `/api` da Vercel faz esse papel.
- **Rodar o stack completo local (SEM Docker):** o banco é o Neon (nuvem), então bastam 2 terminais:
  `npm run dev` (backend :3000) e `npm --prefix frontend run dev` (front :8080). O `.env` (git-ignored)
  guarda `DATABASE_URL` do Neon + `NEXTAUTH_SECRET`. Setup do banco (uma vez): `npm run prisma:generate`
  → `npx prisma migrate deploy` → `npm run prisma:seed` (cria as 5 contas de teste; **não cria animais**).
- **A IA não cria contas nem cola segredos.** Fluxo: a IA prepara config + runbook; o mantenedor
  cria as contas grátis, define `DATABASE_URL`/`NEXTAUTH_SECRET`/`NEXTAUTH_URL`/`UPLOADTHING_TOKEN`
  e dispara o deploy. `NEXTAUTH_SECRET`: `openssl rand -base64 32`.

---

## 8. Identidade visual & design

**Norte estético:** **teal & âmbar** + linguagem **"liquid glass" inspirada na Apple** —
translucidez, blur, profundidade, densidade de função com elegância. **Com disciplina:** vidro é
o acento (cards/overlays/topbar sobre imagem ou profundidade), nunca em tudo; texto sempre legível
(contraste **WCAG AA**). Direção atual = **refinar** o teal/âmbar, não repensar.

- **Cores:** tokens em `frontend/src/styles.css` (`:root` claro + `.dark`). Primária **teal**
  `oklch(0.511 0.086 186.4)`, acento **âmbar** `oklch(0.769 0.165 70.1)`; tokens semânticos
  (success/warning/info/selection), foco acessível e sombras já existem. **Usar tokens semânticos**
  (`bg-primary`, `text-accent`…), nunca cor hardcoded.
- **Tipografia:** corpo **Inter**, títulos **Poppins** (self-hospedadas em `public/fonts`).
- **Componentes:** shadcn em `components/ui`. `glass-card.tsx` é a base do visual Glass (usado na
  tela de login). Acessibilidade que o projeto já tem (foco visível, skip-link) deve ser mantida.
- **Logo oficial:** wordmark **"AP"** (gato no A, cachorro no P; preto + laranja) em
  `frontend/public/logo.png` e `frontend/public/favicon.png`. Usada na navbar, rodapé e login
  (num "chip" branco arredondado, pra funcionar no claro e no escuro). Fonte da arte:
  `arthur-hideo-tcc-main/logo tcc.jpeg` (fora do repo).
- **A definir com o mantenedor:** tom em 3–5 palavras, público nº 1, voz PT-BR.

---

## 9. Fluxo por tarefa

1. Sincronizar: `git checkout main && git fetch origin && git reset --hard origin/main`.
2. Ler contratos reais (backend) antes de consumir no frontend.
3. Implementar (usar tokens/semântica; não mover/criar/remover função sem pedido).
4. **Portão da seção 5** (`tsc` + `build`; regra do `routeTree`).
5. Commit direto na `main` (msg convencional PT + `Co-Authored-By: Claude`), push.
6. Registrar decisões relevantes na memória do projeto.

---

## 10. Roadmap

- **Deploy** do sistema no ar (Neon + Vercel + Cloudflare) + resolver auth mesma-origem. **[prioridade]**
- **Refino visual** teal/âmbar + Glass (Apple), incluindo navbar e marca/favicon.
- **Feature de descoberta por swipe** (feed um-animal-por-vez, curtir→favoritos, proximidade por
  geolocalização) — ainda em **ideação**, sem spec 005 nem código.
