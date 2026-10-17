# Handoff — Spec 009: homologação H12 em diante

> Para retomar numa sessão nova do Claude Code. Escrito em 2026-10-17, ao fim de uma sessão longa.
> Leia este arquivo inteiro antes de agir.

## Onde estamos

- **Worktree:** `C:\Users\pedro\Documents\escola\TCC\Code\Adopt-Place\.claude\worktrees\spec-009-grilling-4395a3`
- **Branch:** `009-lar-temporario-status`. Último commit: `b8c5246`. Ainda não houve push.
- **Spec:** `specs/009-lar-temporario-status/`. Fonte da verdade: `spec.md`, `plan.md`, `tasks.md`,
  `quickstart.md` e `ENTREGA.md`.
- **Fases 1, 2 e 3 concluídas e commitadas.** A Fase 4 está com o código pronto (T079–T086) e a
  homologação em andamento.
- **Banco de desenvolvimento:** branch Neon `dev-009`, no `.env` da worktree.
- **Homologação:** roda no branch Neon **`seed-009`** (decisão do Pedro em 2026-10-14). Os servidores
  ficam de pé no terminal do Pedro, contra o `seed-009`: backend em `:3000`, frontend em `:8080`.
  O `validacao-009` fica **só** para o ensaio da migration com dados reais (T087/T088), seguido de um
  teste rápido do painel (`quickstart.md` §3.1).

## Regras desta sessão (combinadas com o Pedro)

- O agente pode editar o `tasks.md` desta spec e marcar `[X]`. Grave sempre em **UTF-8 sem BOM** e
  confira se não há caracteres nulos (`Select-String -Path ... -Pattern "`0"`).
- **Na homologação:** registre passou ou falhou em cada H, com evidência. **Se algo falhar, pare e
  mostre ao Pedro antes de corrigir.**
- **Nada no banco fora da interface do sistema.** Leituras via `fetch` GET pelo navegador são
  aceitas. Escritas, só pela interface.
- A IA não manuseia `DATABASE_URL` nem cria contas no Neon: tarefas `[Pedro]` são dele.
- Contas de teste (seed): `organizacao.teste@`, `organizacao.resende@`, `acolhedor.teste@`,
  `adotante.aprovado@` (`example.com`). A senha está no §10 do `CLAUDE.md`. Uso permitido só em
  `localhost`.
- **Autorização de 2026-10-17 (noite, Pedro ausente):** falha de homologação com correção contida
  no frontend ou na lógica da 009 pode ser **corrigida e registrada** sem esperar, com teste ou
  evidência E2E e commit próprio. Schema, migration, dados ou algo fora da 009: parar e registrar.
  Push da branch e PR **sem merge** (T096) autorizados.
- Navegador: o embutido (`mcp__Claude_Browser__*`), em `http://localhost:8080`.
- PowerShell 5.1: use `git commit -F <arquivo>`, porque aspas duplas em here-string quebram o `-m`.
- Não rode `npm run build` no frontend com o `vite dev` de pé: ele derruba o servidor do Pedro. Para
  checar, use `npx tsc --noEmit`.

## Resultado da homologação até agora (no `seed-009`)

| H | Resultado | Evidência principal |
|---|---|---|
| H1 | ✅ | Status sem "Resgatado"; ajuda muda por status; Cacau salvo como Em cuidados saiu da vitrine (37 → 36). |
| H2 | ✅ | Telefone inválido e falta de autorização bloqueados com as mensagens da 007; o LT "Ana Paula Ferreira" (id `cmv8qedge00nn12zgp8c64tdg`) foi criado. |
| H3 | ✅ após correção | **Defeito preexistente de fuso** (detalhe abaixo): datas gravavam um dia antes. Corrigido; o Thor ficou "Em tratamento · Procurando LT". |
| H4 | ✅ após correção | **O detalhe público vazava `MEDICAMENTO_TRATAMENTO`** no `resumoSaude`. Corrigido. Vitrine, perfil da ONG, favoritos, solicitações, painel do adotante, Feels e chat estão sem dados de LT ou tratamento. |
| H5 | ✅ após correção | **`?tratamento=1` era descartado da URL** (o router converte para número). Corrigido; os 4 links de card filtram. |
| H6 | ✅ | Luna marcada "Em LT · sem registro"; o vínculo pela aba listou só Luna e Toby; o Toby foi vinculado ao João pelo formulário. |
| H7 | ✅ | `EM_LT` vinculado → Procurando LT e → Não precisa: aviso exibido, `PATCH` 200, vínculo zerado (correção U1 ok). |
| H8 | ✅ | LT "Maria Aparecida Souza" excluído; o diálogo listou Bela e Gaia, que ficaram `EM_LT` sem vínculo; a tela voltou à lista. |
| H9 | ✅ | Seninha: dose concluída com próxima (18/10) continua em tratamento; concluída sem próxima, sai do tratamento. |
| H10 | ✅ | Thor (`EM_LT` Ana Paula) aprovado → `EM_PROCESSO_ADOCAO` mantendo o LT → concluído → `ADOTADO`/`NAO_SE_APLICA`/sem vínculo. Otto `ADOTADO` pelo select manual: campos de LT somem, aviso, reset. |
| H11 | ✅ | Acolhedor: sem menu e sem campos de LT; a URL da aba explica; `?lt=EM_LT` → 400; `/api/lares-temporarios` → 403. |
| **H12** | ⏳ **em andamento** | Como `organizacao.resende`: a lista de LT está vazia (não vê os da outra ONG); `GET` dos 2 LTs da `organizacao.teste` → **404** nos dois; vinculáveis = só Fred, Nala e Salem (dela). **Pendente:** a tela `/dashboard/lares-temporarios/cmv8pxpts000mntn6k5x7jvfx` (LT da outra ONG) **ficou presa em "Carregando conteúdo…"** por mais de 16 s, e a aba de rede mostrou a mesma chamada 404 repetida várias vezes. **Possível falha:** retry infinito ou tela sem estado de erro para 404. Investigar e **mostrar ao Pedro antes de corrigir**. Nenhum dado da outra ONG vazou na tela (`vazouNome: false`). **Reproduzido em 2026-10-17:** não é retry infinito. São 4 `GET` 404 (1 + 3 retries padrão do React Query, com backoff), cerca de 10 s em "Carregando conteúdo…", e então um alerta vermelho "Não foi possível carregar · Lar temporario nao encontrado" com "Tentar novamente". Depois disso não há novas chamadas (20 s observados). Causa: `fetchLarTemporario` lança erro no 404, e o `QueryClient` usa os padrões; o estado vazio "Lar temporário não encontrado" da tela nunca é alcançado. Padrão já existente na base: `lib/data/animais.ts:88` devolve `null` no 404. **Corrigido com OK do Pedro:** `fetchLarTemporario` devolve `null` no `NOT_FOUND`; a tela mostra "Lar temporário não encontrado" na hora, com 1 chamada só. `tsc` verde. Ainda não commitado. |
| H13 | ⏳ **em andamento, 1 falha** | **Passou:** na lista de LT, a ordem de Tab é lógica (skip-link, navbar, menu do painel, "Novo LT", busca, cards) e os 21 focáveis têm foco visível (outline ou ring); a busca tem rótulo "Buscar por nome do tutor"; o diálogo "Novo LT" prende o foco, todos os campos têm rótulo, a autorização é checkbox com rótulo e alterna com Espaço, e o Esc fecha. **Falhou:** ao fechar o diálogo (Esc), o foco vai para o `body` em vez de voltar ao "Novo LT". Causa: `<Dialog open={...}>` controlado sem `DialogTrigger`, e o Radix só devolve o foco ao trigger. Afeta os diálogos novos da 009: "Novo LT" (lista), "Editar" e "Vincular animal" (detalhe). **Aguardando OK do Pedro.** Faltam: detalhe do LT, selects do `AnimalForm`, zoom 200% e contraste AA. |

Observações que não contam como falha:
- O primeiro carregamento de "Meus animais" ficou no esqueleto uma vez e não se repetiu (provável
  compilação inicial do `vite dev`).
- O "0 disponíveis" da home: a API devolve 37. Parece a animação do contador; não verificado a fundo.
- O diálogo de excluir LT diz "Os animais Bela, Gaia continuarão marcado(s)": a concordância no
  plural ficou deselegante.
- A descrição da Seninha no seed menciona "antibiótico": texto livre da ONG, fora do controle do
  sistema.

## Correções feitas na homologação — AINDA NÃO COMMITADAS

Arquivos modificados ou novos (`git status`):

1. **Fuso de data (H3, defeito anterior à 009).** `new Date("AAAA-MM-DD")` era lido como meia-noite
   UTC, o que em UTC-3 vira o dia anterior. Também o "hoje" vinha de `toISOString().slice(0,10)`
   (UTC).
   - Novo `frontend/src/lib/data-local.ts`: `hojeLocal()` e `dataLocalParaIso(data, { ateAgora })`
     (meio-dia local; a data de aplicação nunca passa de "agora", porque o backend recusa data
     futura).
   - Aplicado em `frontend/src/components/app/HealthPanel.tsx` (todos os formulários de saúde) e no
     `CompletionForm` de `frontend/src/routes/_authenticated.dashboard.saude.index.tsx`.
   - Registros antigos continuam com a data deslocada. O Thor tem um tratamento antigo com
     13/10–16/10, mantido como evidência.
2. **Telefone cru no detalhe do LT (H2, cosmético).** Novo `frontend/src/lib/telefone.ts`
   (`formatarTelefone`), usado na lista e no detalhe de LT.
3. **Vazamento de tratamento no detalhe público (H4).**
   - `publicHealthRecordWhere` em `lib/lar-temporario.ts`, aplicado aos dois `registrosSaude` de
     `lib/queries/public-animal.ts`.
   - Caso novo em `__tests__/queries/lt-privacy.test.ts`, visto vermelho antes da correção.
   - Rótulo "Procedimento" em `frontend/src/routes/animais.$animalId.tsx`.
4. **Filtro `tratamento` da URL (H5).** Em `_authenticated.dashboard.animais.index.tsx`, o schema
   aceita `1`/`"1"` e guarda o número `1`; o checkbox grava `1`; a API continua recebendo `"1"`.
5. **Docs:** `quickstart.md` (§3 homologação no `seed-009`, §3.1 teste rápido no `validacao-009`,
   §5) e `tasks.md` (T084/T085 marcadas; T085 e T088–T092 ajustadas à mudança de plano).

Validado: `tsc` dos dois apps verde; `lt-privacy` + `public-animal` verdes (24 testes). **Falta:**
rodar `npm test` completo e commitar. `frontend/.vercel/` é saída de build e **não** entra.

## Próximos passos, em ordem

1. Investigar o H12 (tela presa em "Carregando…" no LT de outra ONG). Mostrar a causa ao Pedro
   e corrigir só com o OK dele.
2. Fazer o H13 (teclado, zoom 200%, contraste AA).
3. Rodar `npm test` (esperado: tudo verde, exceto `organization-search-seed.test.ts`, que falha por
   falta de `DATABASE_URL` no processo do Vitest; é preexistente).
4. Commitar as correções da homologação (`fix:`), marcar T089–T091 em `tasks.md` e registrar H1–H13
   no `ENTREGA.md`: resultados, os 3 defeitos achados e corrigidos (fuso, vazamento público, filtro
   da URL) e as observações.
5. Depois, com o Pedro:
   - T087/T088: ensaio no `validacao-009` + teste rápido do painel (`quickstart.md` §2 e §3.1);
   - T092: apagar `seed-009` e `validacao-009`;
   - Fase 5: `ENTREGA.md`, `README`, §10 do `CLAUDE.md`, PR, virada T097/T098 e T101.

## Prompt sugerido para a nova sessão

> Continue a homologação da spec 009 a partir do H12. Leia primeiro
> `specs/009-lar-temporario-status/HANDOFF-HOMOLOGACAO.md` (estado, regras e pendências), depois o
> `CLAUDE.md`. Os servidores estão no ar em localhost contra o `seed-009`. Use o navegador embutido.
> Se algo falhar, pare e me mostre antes de corrigir. Responda em português.
