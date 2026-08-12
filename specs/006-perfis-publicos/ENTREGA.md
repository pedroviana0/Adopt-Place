# Entrega — Spec 006: Perfis públicos e busca por nome

| | |
|---|---|
| **Período** | iniciada em 2026-08-09 |
| **Branch** | `006-perfis-publicos` (empilhada sobre `fix/guarda-de-porta-no-dev`, PR #121) |
| **Status** | **EM ANDAMENTO** — Ondas 0–1 concluídas; Ondas 2–7 abertas |
| **Spec** | [`spec.md`](spec.md) · **plano e mapa de fontes**: [`HANDOFF.md`](HANDOFF.md) |

> **Este documento é preenchido enquanto a spec avança, não no fim.** Ao concluir cada onda,
> marque-a abaixo com o commit e o que efetivamente mudou. Quem pegar a 007 vai ler daqui.

---

## 1. O que a spec promete

Perfil público endereçável para organização e acolhedor, catálogo filtrável dentro do perfil,
busca por nome só de organizações, e a triagem do adotante entregue **apenas** a quem tem vínculo
de solicitação.

| | História | Prioridade | Onda | Estado |
|---|---|---|---|---|
| US1 | Conhecer uma organização e seus animais | P1 | 1 | ☑ |
| US2 | Chegar ao perfil a partir do anúncio | P1 | 2 | ☐ |
| US3 | Encontrar organizações pelo nome | P2 | 5 | ☐ |
| US4 | Manter o próprio perfil | P1 | 3 | ☐ |
| US5 | Avaliar um adotante com a triagem | P1 | 4 | ☐ |
| US6 | Perfil de acolhedor independente | P3 | 6 | ☐ |

## 2. Ondas de execução

O plano completo, com justificativa de cada onda, está em [`HANDOFF.md`](HANDOFF.md) §6.

| Onda | Escopo | Commits | Estado |
|---|---|---|---|
| 0 | Fundação de dados: `descricao`, `fotoUrl`, `razaoSocialNormalizada` + migration | `6f4ebf6` | ☑ |
| 1 | Perfil público de organização + catálogo (US1) | `7031605` | ☑ |
| 2 | Chegar pelo anúncio: `responsavelId`/`responsavelTipo` nos DTOs (US2) | — | ☐ |
| 3 | Manter o próprio perfil: descrição + imagem (US4) | — | ☐ |
| 4 | Triagem e endereço no público restrito (US5) — núcleo de CR-007 | — | ☐ |
| 5 | Busca por nome sobre coluna normalizada (US3) | — | ☐ |
| 6 | Perfil do acolhedor (US6) | — | ☐ |
| 7 | Dados de teste com acento + homologação na tela | — | ☐ |

## 3. Decisões que não se reabrem

Todas com justificativa na `spec.md`, seção "Clarifications":

1. **A triagem do adotante não é pública.** Vai só para: o próprio adotante, o responsável que tem
   **ou teve** solicitação daquele adotante, e a administração. Para os demais, ela **não pode sair
   da API** — esconder na tela não cumpre FR-017. Motivo: a triagem descreve composição familiar,
   idade das crianças, horas que a casa fica vazia e segurança de muros e janelas.
2. **O endereço do adotante é exibido a esse mesmo público restrito**, identificado como dado de
   análise da solicitação. Nunca no perfil público.
3. **Endereço público só de organização.** Acolhedor e adotante mostram apenas o município —
   acolhedor é pessoa física e o endereço dele é a casa dele.
4. **A busca retorna somente organizações.**
5. **O vínculo que autoriza é a existência da solicitação**, em qualquer status: em análise,
   aprovada, recusada ou concluída.
6. **Telefone fica fora do novo endpoint de perfil do adotante** (SC-002 ao pé da letra). Quem tem
   vínculo continua vendo o telefone no detalhe da solicitação, onde ele já estava. Decisão tomada
   em 2026-08-09 diante da tensão entre SC-002 e FR-016a — ver `HANDOFF.md` §4.3.

## 4. Medições que sustentam o desenho

Feitas em 2026-08-09, contra o banco real. Detalhe em [`HANDOFF.md`](HANDOFF.md) §4.

1. **`mode: "insensitive"` do Prisma não ignora acento.** `nome contains "sao paulo"` → **0
   resultados**; `nomeNormalizado contains "sao paulo"` → **4**. Cumprir FR-012 exige coluna
   normalizada em `Organizacao`, reaproveitando `normalizarNomeMunicipio()`.
2. **Os DTOs públicos de animal não têm identificador do responsável.** O nome é texto puro. No
   Feels, o chip já é clicável — mas leva à página do animal, não ao perfil.

## 5. O que a spec previa e não foi entregue

*(preencher ao fechar a branch)*

## 6. Armadilhas descobertas nesta spec

- **Servidor de dev órfão de sessão anterior.** Com `:3000`/`:8080` ocupados, Next e Vite sobem
  deslocados em vez de falhar, e dois `next dev` no mesmo `.next` corrompem o manifesto: a API passa
  a devolver 500 com `SyntaxError: Unexpected end of JSON input`. Custou uma investigação inteira
  nesta sessão. **Já tem guarda:** `scripts/porta-livre.mjs`, ligado por `predev` nos dois
  `package.json` (PR #121).

## 7. Onde o código vive

### Onda 0 — fundação de dados (commit `6f4ebf6`)

- `prisma/schema.prisma`: campos de apresentação em `Organizacao` e
  `AcolhedorIndependente`, coluna obrigatória `razaoSocialNormalizada` e índice.
- `prisma/migrations/20260811210000_perfis_publicos/migration.sql`: adiciona campos
  nullable, faz backfill com `translate`/`lower`/compressão de espaços/trim e cria o
  índice sem reset ou drop.
- `lib/actions/auth-register.ts`, `app/api/perfil/route.ts` e `prisma/seed.ts`:
  gravam a coluna derivada exclusivamente por `normalizarNomeMunicipio()`.
- `lib/schemas/perfil.ts`: descrição nullable com trim, vazio convertido em `null` e
  limite de 500 caracteres; campos derivados continuam rejeitados.
- `scripts/verify-razao-social-normalizada.ts`: verificador read-only contra todas
  as organizações.
- `__tests__/actions/auth-register.test.ts` e `__tests__/api/profile-screening.test.ts`:
  cobertura de cadastro, sincronização atômica e validação de descrição.

**Validação factual:** em banco local Docker, `prisma migrate deploy` aplicou as
migrations pendentes de notificações, localização e Onda 0. O verificador encontrou
1 organização e 0 divergências. `npm run prisma:validate`, `npx tsc --noEmit`,
`npm test` (299 testes), frontend `npx tsc --noEmit` e `npm run build` passaram.
`routeTree.gen.ts` e `legacy/` permaneceram inalterados; seed não foi executado.

### Onda 1 — perfil público de organização e catálogo (commit `7031605`)

- `GET /api/perfis/organizacao/[id]`: perfil institucional estreito para organização
  ativa, com 400 seguro e 404 indistinguível para ausente ou desativada.
- `lib/queries/public-profiles.ts`: catálogo limitado aos animais `DISPONIVEL` da
  própria organização, com filtros de espécie, raça, porte e sexo e paginação de 30.
- `frontend/src/routes/organizacoes.$organizacaoId.tsx` e `ProfileCatalog.tsx`: jornada
  pública responsiva, filtros reversíveis, raça condicional e estados de carregamento,
  vazio e erro.
- Testes contract-first provaram allowlist sem CPF, CNPJ, e-mail, telefone,
  coordenadas ou identificadores internos. A remoção temporária do predicado de conta
  ativa fez o teste de autorização falhar e foi revertida antes do commit.

**Validação factual:** backend `npx tsc --noEmit` e `npm test` (307 testes), frontend
`npx tsc --noEmit` e `npm run build` passaram. A interface foi homologada anonimamente
em 375, 1024 e 1440 px, sem overflow horizontal, incluindo filtro/reversão, raça
condicional, catálogo próprio e estado de perfil inexistente. `routeTree.gen.ts` foi
versionado porque a onda criou rota; `legacy/` permaneceu inalterado e seed não foi
executado.
