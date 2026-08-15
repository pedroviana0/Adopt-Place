# Deploy do AdoptPlace (custo zero) — runbook

> Objetivo: sistema **no ar**, grátis. Stack: **Neon** (banco) + **Vercel** (backend Next + frontend TanStack).
> O que a IA já preparou no repo está marcado com ✅. O que **só você pode fazer** (criar contas,
> colar segredos) está marcado com 👤.

## Visão geral

São **dois projetos Vercel** a partir do **mesmo repositório**:

| Projeto Vercel | Root Directory | O que é |
|---|---|---|
| `adoptplace-api` (backend) | `/` (raiz) | Next.js: `/api/*`, NextAuth, Prisma |
| `adoptplace` (frontend) | `frontend/` | TanStack Start/Vite (SSR) |

O frontend reescreve `/api/*` → backend (mesma origem no navegador) → o cookie de login funciona.
O banco é o **Neon** já criado (a mesma `DATABASE_URL` de dev serve produção).

Preparado no repo:
- ✅ `package.json` com `postinstall: prisma generate` (Prisma no build da Vercel).
- ✅ `frontend/vercel.json` com o rewrite `/api/*` (falta trocar o host do backend — passo 3).

---

## Passo 1 — Backend (Next.js) 👤

1. Em **vercel.com**, faça login com o **GitHub** e **Add New → Project**; importe o repo `Adopt-Place`.
2. **Root Directory:** `/` (raiz). Framework detectado: **Next.js**. Build/Install: padrão.
3. **Environment Variables** (Settings → Environment Variables):
   - `DATABASE_URL` = a connection string do Neon (a mesma do `.env`).
   - `NEXTAUTH_SECRET` = a mesma do `.env` (ou gere outra com `openssl rand -base64 32`).
   - `NEXTAUTH_URL` = **a URL pública do FRONTEND** (você preenche no passo 3, depois do front existir).
   - `UPLOADTHING_TOKEN` = token **V7** completo do painel UploadThing (obrigatório para qualquer upload; não use apenas a chave `sk_...`).
4. **Deploy.** Anote a URL gerada, ex.: `https://adoptplace-api.vercel.app`.

## Passo 2 — Frontend (TanStack/Vite) 👤

1. **Add New → Project** de novo, mesmo repo. **Root Directory:** `frontend`.
2. **Environment Variables:** adicione `NITRO_PRESET` = `vercel` (faz o build sair no formato da Vercel).
3. **Deploy.** Anote a URL, ex.: `https://adoptplace.vercel.app`.

## Passo 3 — Ligar as duas pontas (mesma origem) 👤 + ✅

1. No repo, edite **`frontend/vercel.json`**: troque `https://SEU-BACKEND.vercel.app` pela URL real do
   backend (passo 1). Commit + push → a Vercel redeploya o frontend sozinho.
2. No projeto **backend** (Vercel), ajuste `NEXTAUTH_URL` = URL do **frontend** (passo 2) e **redeploy**.
3. Pronto: o navegador acessa tudo pela origem do frontend; `/api` cai no backend; o cookie do
   NextAuth fica first-party.

## Passo 4 — Banco em produção ✅ (já feito) / 👤 (se banco novo)

A `DATABASE_URL` aponta pro Neon que **já tem as tabelas e o seed** (migrations + 6 animais + contas
de teste). Se algum dia trocar de banco: `npx prisma migrate deploy` e `npm run prisma:seed`
apontando a `DATABASE_URL` nova.

## Passo 5 — Verificar

- Abra a URL do frontend → a **vitrine** deve listar os 6 animais.
- Faça **login** com `adotante.aprovado@example.com` / `AdoptPlace@2026`.
- Se o login falhar em produção, revise o passo 3 (rewrite do `/api` e `NEXTAUTH_URL`).

---

## Referência rápida — variáveis por projeto (colar na Vercel)

**Projeto backend** (Settings → Environment Variables):

| Chave | Valor / onde pegar |
|---|---|
| `DATABASE_URL` | a connection string do Neon (a MESMA do seu `.env` local) |
| `NEXTAUTH_SECRET` | a MESMA do `.env` (ou gere outra: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | a URL pública do **frontend** (ex.: `https://adoptplace.vercel.app`) |
| `UPLOADTHING_TOKEN` | token **V7** completo do painel UploadThing (obrigatório; uma chave antiga `sk_...` é inválida) |

**Projeto frontend** (Settings → Environment Variables):

| Chave | Valor |
|---|---|
| `NITRO_PRESET` | `vercel` |

Checklist de ordem: (1) deploy backend → anota URL · (2) deploy frontend → anota URL ·
(3) põe a URL do frontend em `NEXTAUTH_URL` (backend) e a URL do backend no `frontend/vercel.json` ·
(4) redeploy dos dois · (5) testa login na URL do frontend.

## Observação honesta (pode exigir 1 ajuste)

TanStack Start (nitro, preset `vercel`) + rewrite `/api` na Vercel é a rota recomendada, mas a
interação exata pode pedir **uma iteração** no primeiro deploy. Se o `/api` não resolver via
`frontend/vercel.json`, a alternativa é proxiar no próprio nitro (route rules) — me chame que eu
ajusto o repo com a URL real do backend em mãos.
