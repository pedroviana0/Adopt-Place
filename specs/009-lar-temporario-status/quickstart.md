# Quickstart — Spec 009: ensaio das migrations, homologação e virada

Ambiente: Windows + PowerShell (`;` encadeia comandos, não `&&`). Sem Docker: o banco é o Neon.

**Regra de segredos.** A IA não cria contas nem manuseia `DATABASE_URL`. Os passos marcados
**[Pedro]** são feitos pelo Pedro, executor da 009, no console do Neon e no próprio terminal.

---

## 0. Portão local (sem banco), a cada commit

```powershell
npm run prisma:validate; npm run prisma:generate; npx tsc --noEmit; npm test
cd frontend; npx tsc --noEmit; npm run build; cd ..
```

O build do frontend regenera `routeTree.gen.ts`. Como esta spec **adiciona rotas**, o arquivo é
commitado (§5 do `CLAUDE.md`). Não rode o build com o `vite dev` de pé.

## 0.1 Banco de desenvolvimento `dev-009` (T001, antes de tudo)

**Por quê.** Hoje o `.env` local aponta para o **mesmo Neon da produção** (§7 do `CLAUDE.md`). A partir
de T007, o Prisma Client gerado espera o schema novo. Rodar o app ou uma migration contra a produção
antes de T097 quebraria a vitrine ou adiantaria a virada fora de ordem. Toda migration da 009 roda
**só no `dev-009`** até T097.

**[Pedro] No console do Neon** (console.neon.tech):

1. **Anote o endpoint da produção.** Abra o projeto do AdoptPlace e, no menu lateral, vá em
   **Branches**. Clique no branch de produção (o padrão, marcado como *Default*/*Primary*, em geral
   `main` ou `production`). Na seção **Computes**, anote o ID do endpoint, no formato
   `ep-xxxx-xxxx-xxxxxxxx`. Esse ID aparece no host de toda connection string desse branch.
2. **Crie o branch.** Em **Branches**, clique em **New branch** (ou **Create branch**). Nome:
   `dev-009`. Parent: o branch de produção. Dados: **Current data** (cópia atual). Clique em
   **Create**.
3. **Copie a connection string.** No dashboard do projeto, clique em **Connect**. Em **Branch**,
   escolha `dev-009`; mantenha o mesmo database e role de hoje. Copie a string no **mesmo formato** da
   que está no `.env` (pooled, com `-pooler` no host, ou direta), para não mudar o comportamento do
   Prisma.

**No `.env` local** (git-ignored, na raiz do checkout onde você roda o `npm`; a worktree não tem
`.env`, então crie ou copie um lá se for trabalhar nela):

4. Troque **só** a variável `DATABASE_URL` pela string do `dev-009`. Guarde a linha antiga **comentada**
   (`# DATABASE_URL=… produção`), para a volta em T101. `NEXTAUTH_SECRET` e as demais ficam como
   estão.
5. **Confira que o `.env` NÃO aponta para a produção** (troque `ep-PRODUCAO` pelo ID anotado no passo 1):

   ```powershell
   $linha = (Select-String -Path .env -Pattern '^\s*DATABASE_URL\s*=').Line
   $url = $linha -replace '^\s*DATABASE_URL\s*=\s*"?', '' -replace '"\s*$', ''
   $hostDb = ([uri]$url).Host; "host: $hostDb"
   if ($hostDb -like '*ep-PRODUCAO*') { 'PARE: o .env aponta para a PRODUCAO' } else { 'ok: nao e a producao' }
   if ($env:DATABASE_URL) { 'ATENCAO: ha DATABASE_URL no terminal; ela tem precedencia sobre o .env' }
   ```

   O script imprime só o host, nunca a senha. Repita a conferência antes de cada `migrate deploy`
   (T007) e sempre que abrir um terminal novo.
6. Aplique as migrations no `dev-009` (T007): `npx prisma migrate deploy` e depois
   `npx prisma migrate status`.

O `dev-009` contém **cópia de dados reais**: não compartilhe a string e apague o branch em T101.

## 1. Gerar as migrations (offline, sem shadow database)

Rode esta seção no **Git Bash**. No PowerShell 5.1, `>` grava UTF-16 e `Out-File -Encoding utf8`
grava BOM. O `migration.sql` precisa ser UTF-8 sem BOM.

```bash
mkdir -p .tmp-009
git show main:prisma/schema.prisma > .tmp-009/schema-main.prisma
```

**Migration 1** (`<ts1>_status_sem_resgatado`). Altere no schema **só** o enum `StatusAnimal` (sem
`RESGATADO`) e o `@default(EM_CUIDADOS)`. Depois:

```bash
mkdir -p prisma/migrations/<ts1>_status_sem_resgatado
npx prisma migrate diff --from-schema-datamodel .tmp-009/schema-main.prisma --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<ts1>_status_sem_resgatado/migration.sql
cp prisma/schema.prisma .tmp-009/schema-pos-m1.prisma
```

Edite à mão: logo depois de `BEGIN;`, insira
`UPDATE "Animal" SET "status" = 'EM_CUIDADOS' WHERE "status" = 'RESGATADO';`. Confira a ordem do
research R1.

**Migration 2** (`<ts2>_lar_temporario`, com `ts2 > ts1`). Acrescente `SituacaoLT`, `LarTemporario`,
os campos de `Animal` e a relação em `Organizacao`. Depois:

```bash
mkdir -p prisma/migrations/<ts2>_lar_temporario
npx prisma migrate diff --from-schema-datamodel .tmp-009/schema-pos-m1.prisma --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<ts2>_lar_temporario/migration.sql
rm -rf .tmp-009
```

A migration 2 vai sem edição manual. Não commite `.tmp-009/`.

## 2. Ensaio no branch do Neon

1. **[Pedro]** No console do Neon, criar o branch **`validacao-009`** a partir da produção.
   Definir `$env:DATABASE_URL` com a URL desse branch **no próprio terminal**. A variável do terminal
   tem precedência sobre o `.env`, que continua no `dev-009`. Confira o host com o script do §0.1,
   trocando a fonte por `$env:DATABASE_URL`.
2. **[Pedro]** No SQL Editor do branch, só leitura:
   `SELECT status, count(*) FROM "Animal" GROUP BY status;`. Anote o total.
3. Aplicar e conferir:
   ```powershell
   npx prisma migrate deploy
   npx prisma migrate status
   npx prisma migrate diff --from-url "$env:DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code
   npx tsx scripts/verify-009-migration.ts
   ```
   Esperado:
   - `migrate status` "up to date";
   - `migrate diff` com saída **0** (sem drift);
   - verificador:
     - total de animais igual ao do passo 2;
     - `EM_CUIDADOS` = antigo `EM_CUIDADOS` + antigo `RESGATADO`;
     - 100% `situacaoLT = NAO_SE_APLICA`;
     - 0 `LarTemporario`;
     - 0 violações de I1 a I4.

`scripts/verify-009-migration.ts` é **read-only**, feito com Prisma Client, no padrão de
`scripts/verify-razao-social-normalizada.ts`. Ele imprime contagens e sai com código ≠ 0 se alguma
invariante falhar.

## 3. Homologação local no `seed-009`

> **Mudança de plano (2026-10-14, decisão do Pedro):** a homologação H1–H13 roda no **`seed-009`**,
> com as contas e os dados de teste do seed (§5). O `validacao-009` fica **só** para o ensaio da
> migration com dados reais (§2), seguido de um teste rápido do painel (§3.1). Motivo: no
> `seed-009` há contas de teste com papéis conhecidos (duas ONGs, acolhedor, adotante) e animais
> preparados para cada roteiro, sem criar dados de teste numa cópia da produção.

Dois terminais na raiz, com `DATABASE_URL` apontando para `seed-009`:

```powershell
npm run dev                      # backend :3000 — espere responder antes do próximo
npm --prefix frontend run dev    # front   :8080
```

Os dados partem do seed (§5). Durante a homologação, **nada é alterado no banco fora da interface
do sistema**. O H1 usa um animal "Em cuidados" criado pela interface, já que o seed nunca teve
`RESGATADO`; a conversão real de `RESGATADO` é provada no ensaio do §2.

| # | Roteiro | Critério |
|---|---|---|
| H1 | Animal antes `RESGATADO` aparece como "Em cuidados", fora da vitrine; o select de Status não oferece "Resgatado"; o texto de ajuda muda conforme o status | CA-02, RF-004 |
| H2 | Como ONG, cadastrar LT sem marcar a autorização → bloqueado; marcando → criado; telefone inválido → mensagem da 007 | CA-07, RF-022a |
| H3 | Animal `DISPONIVEL` com 2 fotos: registrar "Medicamento / tratamento" com próxima dose; marcar `PROCURANDO` | CA-01 (preparação) |
| H4 | O animal de H3 na vitrine, no detalhe público, no Feels, nos favoritos, na solicitação e no chat do adotante: nenhum sinal de LT ou tratamento (DevTools → Network → JSON) | CA-01, RF-015 |
| H5 | O mesmo animal no painel: badges "Em tratamento" e "Procurando LT"; os cards "Em tratamento" e "Procurando LT" o contam; os cards levam à lista filtrada | CA-01, RF-016 a RF-019 |
| H6 | Marcar `EM_LT` sem LT → badge "Em LT · sem registro" e o card correspondente; vincular pela aba (o seletor lista só `EM_LT` sem vínculo); vincular pelo formulário | CA-05, C12 |
| H7 | Trocar de `EM_LT` vinculado para `PROCURANDO` → aviso no formulário; **salvar funciona sem erro** (o form envia `larTemporarioId: null`, sem `INVALID_FOSTER_LINK`) e o vínculo some; repetir trocando para "Não precisa" | CA-04 |
| H8 | Excluir um LT com 2 animais → o diálogo lista os 2; depois, os 2 ficam "Em LT · sem registro" | CA-06 |
| H9 | Na agenda, concluir a dose com nova "Próxima dose" → continua em tratamento; concluir sem próxima dose → o badge some | CA-08, RF-008 |
| H10 | Levar até `ADOTADO` pela solicitação (aprovar, depois concluir) um animal `EM_LT` vinculado → `NAO_SE_APLICA`; repetir pelo select manual | CA-03 |
| H11 | Logar como acolhedor: não há aba de LT nem campos de LT; a URL `/dashboard/lares-temporarios` explica que é só para organizações; `GET /api/animais/gerenciados?lt=EM_LT` → 400 | CA-07, RF-018 |
| H12 | Logar como outra ONG: a lista de LT não mostra os da primeira; `GET /api/lares-temporarios/<id da outra>` → 404 | CA-07 |
| H13 | Teclado e zoom 200% na aba nova e nos selects do `AnimalForm`; contraste AA dos badges | §8 do `CLAUDE.md` |

Registre o resultado de cada linha em `ENTREGA.md`, com data e evidência. Depois da homologação,
**[Pedro]** apague o branch `seed-009` (§5, passo 5).

### 3.1 Teste rápido do painel no `validacao-009` (depois do §2)

Com os servidores apontando para o `validacao-009` (dados reais já migrados), entrar com uma conta
de ONG real ou de teste existente na produção e conferir, **sem gravar nada**:
- a vitrine abre e os animais antes `RESGATADO` não aparecem nela;
- o painel abre com os cards "Em tratamento", "Procurando LT" e "Em LT sem registro" (zerados, porque
  ninguém tem LT ainda);
- "Meus animais" mostra esses animais como "Em cuidados";
- a aba "Lares temporários" abre vazia.

Depois, **[Pedro]** apague o branch `validacao-009`: ele contém cópia de dados reais.

## 4. Virada em produção (ordem obrigatória)

1. **[Pedro]** Criar o branch de backup **`pre-009`** a partir da produção.
2. **[Pedro]** Com `$env:DATABASE_URL` da **produção**:
   `npx prisma migrate deploy`, depois `npx tsx scripts/verify-009-migration.ts`.
3. Se o verificador passar: merge do PR na `main`, e a Vercel publica o código novo.
4. Smoke em produção: vitrine abre, o painel da ONG mostra os cards novos, a aba de LT abre.
5. **[Pedro] 7 dias depois do merge** (T101), sem incidente: apagar os branches `pre-009` e `dev-009`
   e voltar o `DATABASE_URL` do `.env` para a linha original comentada no §0.1. Os dois contêm cópia
   de dados reais.

**Rollback**
- Antes do passo 3: restaurar a produção a partir de `pre-009` no console do Neon.
- Depois do passo 3: reverter o merge e restaurar `pre-009`. Os dados gravados no intervalo se perdem.

O código **nunca** vai para a `main` antes do passo 2. Ao contrário, a vitrine responde 500 (research
R3).

## 5. Seed no branch descartável `seed-009` (T084–T085)

O seed roda `clearTestData` e **apaga tudo** que encontra. Por isso ele **nunca** roda no `dev-009` nem
na produção: só num branch vazio, criado para isso e apagado em seguida.

1. **[Pedro]** No console do Neon, em **Branches → New branch**: nome `seed-009`, parent `dev-009`
   (que já tem o schema da 009). Em dados, escolha **Schema only**, para não copiar dados reais. Se a
   opção não aparecer no seu plano, use **Current data**: o passo 3 apaga tudo de qualquer forma.
   Copie a connection string em **Connect → Branch `seed-009`**.
2. Num **terminal novo**, aponte só a variável do terminal, sem mexer no `.env`, e confira o host.
   Ele não pode conter o endpoint da produção nem o do `dev-009`:

   ```powershell
   $env:DATABASE_URL = "<connection string do seed-009>"
   ([uri]$env:DATABASE_URL).Host
   ```
3. Recrie o banco pelas migrations e rode o seed. `migrate reset` executa o seed configurado em
   `prisma db seed`, incluindo os municípios:

   ```powershell
   npx prisma migrate reset --force
   ```
4. Nesse mesmo terminal, suba o backend com `npm run dev`. Em outro terminal, suba o frontend com
   `npm --prefix frontend run dev`; o front só faz proxy e não acessa banco. Confira:
   - 7 contas;
   - **37 animais** (36 + Seninha);
   - 2 LTs da `organizacao.teste`, com `situacaoLT` distribuída;
   - a Seninha `DISPONIVEL` + `PROCURANDO` + em tratamento, com os badges e cards no painel.

   O seed desloga a sessão do navegador (§10 do `CLAUDE.md`).
5. **[Pedro]** Use este mesmo terminal para a homologação do §3. Ao terminar, encerre os
   servidores, rode `Remove-Item Env:DATABASE_URL` e apague o branch `seed-009` no console.
