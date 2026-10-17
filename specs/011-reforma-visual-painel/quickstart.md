# Quickstart — Spec 011

Windows + PowerShell (use `;`, não `&&`). Sem migration: **não** há virada especial nem branch de
ensaio no Neon.

## 1. Preparar

```powershell
git checkout 011-reforma-visual-painel
npm ci; npm --prefix frontend ci    # só se node_modules estiver ausente ou desatualizado
```

Conferir que o `.env` **não** aponta para a produção, antes de qualquer homologação:

```powershell
npx prisma migrate status           # deve listar as migrations e "up to date"
```

Comparar o host do `DATABASE_URL` com o da produção (Vercel). Se for o mesmo, parar.

## 2. Testes (antes do código: vermelhos)

```powershell
npx vitest run __tests__/frontend/dashboard-visual.test.ts __tests__/frontend/dashboard-render.test.ts
```

O render test importa os componentes com caminho relativo (`../../frontend/src/...`); o `@/` dentro
deles resolve pelo `frontend/tsconfig.json` (research R1).

## 3. Portão (SC-04)

```powershell
npx tsc --noEmit                    # backend
npm test                            # 1 falha esperada: organization-search-seed (sem DATABASE_URL no terminal)
cd frontend; npx tsc --noEmit; npm run build; cd ..
git status --short frontend/src/routeTree.gen.ts   # deve vir vazio; se mudou: git checkout -- frontend/src/routeTree.gen.ts
```

Não rodar `npm run build` com o `vite dev` no ar (derruba o dev server).

Conferir SC-02 (escopo do diff):

```powershell
git diff --stat main...HEAD -- app lib prisma package.json package-lock.json frontend/package.json frontend/package-lock.json
```

Deve vir vazio.

## 4. Servidores para homologar

Dois terminais na raiz (o `predev` falha alto se a porta estiver ocupada):

```powershell
npm run dev                         # backend :3000 — esperar responder
npm --prefix frontend run dev       # front   :8080
```

Senha das contas do seed: `AdoptPlace@2026`.

## 5. Roteiro H1–H12

Ver a tabela da `spec.md` (Critérios de aceitação). Notas de execução:

- **H3 (painel vazio):** cadastrar uma ONG nova pela interface em `http://localhost:8080`. Registrar o
  e-mail usado no `ENTREGA.md` (não a senha).
- **H5:** se a `organizacao.teste` tiver ≤ 5 pendências, criar cuidados atrasados pela Central de
  Saúde no local até passar de 5.
- **H7:** com o painel aberto, parar o backend e recarregar; o erro aparece depois dos retries
  (~10 s, comportamento mantido). Subir o backend e clicar em "Tentar de novo".
- **H9:** `resize_window` 375×812, 768×1024, desktop; zoom 200% = viewport CSS 640×400.
- **H11:** esperar `document.getAnimations()` esvaziar antes de medir; medir na página real, não em
  iframe oculto (armadilha da 009). Critério da C14.
- **H12:** prints do painel da `organizacao.teste`, claro e escuro, desktop.

## 6. Fechamento

Preencher o `ENTREGA.md` com hashes, abrir o PR para `main` e fazer merge normal. Depois, refazer os
prints na v21 e nos slides.
