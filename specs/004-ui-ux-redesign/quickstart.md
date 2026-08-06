# Quickstart de validação e homologação

## Pré-condições e baseline

1. Iniciar o backend raiz e o frontend oficial somente contra ambiente e contas de teste autorizados.
2. Obter uma sessão distinta para **visitante**, **adotante**, **organização**, **acolhedor independente** e **administrador**. Se uma credencial ainda não estiver disponível, registrar apenas o identificador descritivo do perfil e bloquear a homologação daquele perfil; nunca registrar senha, token, cookie ou dado privado.
3. Antes da primeira alteração visual, capturar baseline em `docs/audits/004-ui-ux-baseline/` para 375, 1024 e 1440 px, registrando perfil, rota, estado, data e caminho do arquivo. Organização e acolhedor devem ter capturas, destinos disponíveis e evidências separados, mesmo quando o comportamento esperado for idêntico.
4. Repetir a mesma matriz após cada onda e no aceite final, usando o mesmo papel, dado de teste, viewport, zoom e estado quando aplicável.

### Registro da baseline pré-implementação — 2026-08-05

A baseline foi concluída antes da primeira mudança visual na branch `004-99-baseline-visual`. O inventário rastreável, as limitações e os 102 arquivos PNG estão em [`docs/audits/004-ui-ux-baseline/`](../../docs/audits/004-ui-ux-baseline/README.md). Foram usadas sessões separadas de visitante, adotante, organização, acolhedor independente e administrador, sempre com dados de teste preexistentes e sem registrar credenciais, cookies, tokens ou segredos.

| Item do gate | Resultado anterior à implementação |
|---|---|
| Viewports | 375 × 812, 1024 × 768 e 1440 × 900 em todas as rotas/estados alcançáveis enumerados no inventário |
| Zoom | 100% registrado; o navegador interno não oferece controle de zoom nativo, portanto 200% permanece explicitamente pendente para T044 |
| Organização × acolhedor | sessões, destinos e arquivos separados; estados dinâmicos inexistentes no acolhedor foram mantidos como vazio, sem criar dados |
| Rotas dinâmicas | IDs obtidos apenas de links renderizados com dados existentes; conversa do adotante e detalhes dinâmicos do acolhedor indisponíveis e registrados como limitações |
| Privacidade | nenhum segredo ou valor de autenticação foi persistido nas evidências |
| Comparabilidade | arquivos `before/` usam prefixo estável e sufixo do viewport; o modo de enquadramento por grupo está documentado no inventário |

### Baseline de contratos e arquitetura a preservar

A referência canônica é [`specs/003-backend-frontend-integration/contracts/http-contract-inventory.md`](../003-backend-frontend-integration/contracts/http-contract-inventory.md). A feature 004 não altera nenhum método, caminho, DTO, código de erro, política de credenciais, escopo de papel/propriedade/participação ou comportamento de Uploadthing registrado ali.

- O frontend oficial permanece em `frontend/` e consome `/api/*` por HTTP relativo com credenciais de sessão; Prisma e PostgreSQL permanecem exclusivos do backend Next.js na raiz.
- NextAuth continua responsável por login, sessão, logout e cookie seguro; o navegador não recebe senha persistida, token, cookie ou identidade confiável fornecida pelo cliente.
- Validação confiável, autorização, regras de transição e DTOs allowlist permanecem nos Route Handlers e serviços do backend; Zod do cliente é apenas auxílio de UX.
- Permanecem congelados para regressão os grupos: autenticação/sessão, vitrine pública, cadastro/perfil/triagem, favoritos, solicitações, animais/fotos/relacionamentos, saúde, documentos, dashboard, chat e administração.
- Não há migration, seed, reset, novo endpoint, mudança de domínio ou alteração de contrato planejada para a feature 004.

### Gate técnico anterior à implementação

| Validação | Resultado em 2026-08-05 |
|---|---|
| `git diff --check` | aprovado |
| `npm run typecheck` | aprovado |
| `npm run prisma:validate` | aprovado; schema existente válido |
| `npm run lint` (raiz) | aprovado |
| `npm run build` (backend raiz) | aprovado após pausar o servidor de desenvolvimento que concorria pelo diretório `.next`; servidor local restaurado depois do build |
| `npm run build` (`frontend/`) | aprovado; apenas avisos informativos de bundle/plugin, sem falha |
| `npm run lint` (`frontend/`) | falha preexistente reproduzida: 12.466 erros, majoritariamente `prettier/prettier` por CRLF, e 7 avisos; nenhuma correção ou formatação massiva aplicada |
| Escopo do diff | somente documentação e capturas em `docs/audits/004-ui-ux-baseline/` e marcação T001–T004; nenhum arquivo em `app/`, `lib/`, `prisma/`, `frontend/src/` ou `legacy/frontend-antigo/` alterado |

### Gate C1 — tokens, primitives e foco (Issue #100)

A validação detalhada e as quinze capturas comparáveis estão em [`docs/audits/004-ui-ux-baseline/issue-100/`](../../docs/audits/004-ui-ux-baseline/issue-100/README.md). Foram verificadas sessões separadas dos cinco perfis, sem persistir credenciais ou dados de sessão.

| Grupo verificado | Menor razão light | Menor razão dark | Resultado |
|---|---:|---:|---|
| Texto principal e secundário | 7,35:1 | 5,51:1 | AA para texto normal |
| Primária oliva | 6,88:1 | 7,12:1 | AA para texto normal |
| Terracota discreta | 10,10:1 | 6,97:1 | AA para texto normal |
| Erro/destrutiva | 5,82:1 | 4,59:1 | AA para texto normal |
| Sucesso | 7,74:1 | 7,92:1 | AA para texto normal |
| Aviso | 8,91:1 | 9,88:1 | AA para texto normal |
| Informação | 6,45:1 | 7,70:1 | AA para texto normal |
| Seleção | 10,75:1 | 9,75:1 | AA para texto normal e estado não textual |
| Limite de input contra superfície | 3,38:1 | 7,31:1 | atende 3:1 para componente não textual |
| Foco contra a superfície do offset | 9,96:1 | 10,91:1 | atende 3:1; o offset evita medir o anel contra o preenchimento oliva |

O lint focado das primitives foi aprovado, com um aviso estrutural preexistente em `button.tsx`; o build do frontend e `git diff --check` foram aprovados. A rolagem horizontal preexistente do shell em 375 px foi preservada e registrada para T010–T014, fora do escopo deste gate.

## População principal e matriz de homologação

Pertencem à população: `/`, `/vitrine`, `/animais/$animalId`, `/login`, `/cadastro`, `/cadastro/adotante`, `/cadastro/organizacao`, `/cadastro/acolhedor`, `/meu-perfil`, `/triagem`, `/meus-favoritos`, `/minhas-solicitacoes`, `/mensagens`, `/mensagens/$conversaId`, `/dashboard`, `/dashboard/perfil`, `/dashboard/animais`, `/dashboard/animais/novo`, `/dashboard/animais/$animalId`, `/dashboard/solicitacoes`, `/dashboard/solicitacoes/$solicitacaoId`, `/dashboard/saude`, `/dashboard/documentos`, `/dashboard/mensagens`, `/dashboard/mensagens/$conversaId` e `/dashboard/admin/usuarios`. Cada rota alterada por responsividade ou por componente compartilhado deve ser registrada em 375, 1024 e 1440 px e em 200% de zoom. Inclusão posterior exige atualização prévia de `spec.md`, desta matriz e da tarefa correspondente.

| Perfil | Rota(s) | Controle/estado | Requisito | Método e resultado esperado | Evidência |
|---|---|---|---|---|---|
| Visitante | `/`, `/vitrine`, `/animais/$animalId`, `/login`, `/cadastro/*` | Navbar, formulários, filtro, card, detalhe, loading/skeleton, vazio, erro, sucesso e falha de imagem | FR-001–FR-003, FR-006, FR-008–FR-010, FR-014–FR-015, FR-018–FR-019 | Teclado e comparação visual nos três viewports; destinos, foco, filtros, formulários, mídia e recuperação seguem os resultados definidos | Captura antes/depois e roteiro preenchido |
| Adotante | `/meu-perfil`, `/triagem`, `/meus-favoritos`, `/minhas-solicitacoes`, `/mensagens/*` | Formulário, lista, chat ativo/arquivado, loading, vazio, erro e sucesso | FR-001, FR-006–FR-007, FR-011, FR-014–FR-016, FR-018–FR-019 | Teclado, zoom e regressão nos três viewports; dados, validação e permissões atuais preservados | Captura e resultado de regressão |
| Organização | `/dashboard`, `/dashboard/perfil`, `/dashboard/animais/*`, `/dashboard/solicitacoes/*`, `/dashboard/saude`, `/dashboard/documentos`, `/dashboard/mensagens/*` | Shell, perfil, formulário, animal/foto, solicitação, saúde, documento, chat e confirmação | FR-001, FR-004–FR-007, FR-011, FR-014–FR-019 | Sessão própria; registrar destinos, teclado, formulário, Uploadthing, confirmação e jornada operacional separadamente | Captura, roteiro e resultado por rota |
| Acolhedor independente | `/dashboard`, `/dashboard/perfil`, `/dashboard/animais/*`, `/dashboard/solicitacoes/*`, `/dashboard/saude`, `/dashboard/documentos`, `/dashboard/mensagens/*` | Mesmos controles da organização, limitados pela permissão atual | FR-001, FR-004–FR-007, FR-011, FR-014–FR-019 | Sessão própria; registrar separadamente resultados iguais e qualquer divergência real de permissão | Captura, roteiro e resultado por rota |
| Administrador | `/dashboard/admin/usuarios` | Lista densa, loading, vazio, erro, sucesso, estado da conta, toggle e confirmação | FR-004–FR-007, FR-011–FR-012, FR-014–FR-016, FR-019 | Teclado, lista responsiva, cancelamento e foco nos três viewports | Captura e resultado de regressão |

Para cada componente compartilhado modificado, registrar estados aplicáveis: padrão, hover, focus-visible, selected, disabled, loading, skeleton, vazio, erro e sucesso. Para contraste, registrar texto normal/superfície (mínimo 4,5:1), texto grande (3:1), ação primária, limites de controles, foco, erro, aviso, sucesso, informação e seleção (3:1 quando sujeitos ao critério não textual); estados inativos normativamente excepcionados devem ser identificados. Alvos não inline devem atingir 24 × 24 CSS px ou a exceção WCAG 2.5.8 deve ser justificada.

O denominador de SC-003 é formado por todos os controles interativos introduzidos ou modificados no diff de cada PR e por todos os controles acionáveis já enumerados nesta matriz nas rotas consumidoras. Antes da validação do PR, registrar uma linha por controle com arquivo, rota, papel e estados aplicáveis; nenhum controle desse inventário pode ser excluído por amostragem.

## Procedimentos manuais obrigatórios

| Procedimento | Papel | Rota | Preparação/controle | Viewport | Ação | Resultado esperado | Evidência |
|---|---|---|---|---|---|---|---|
| Primitives e foco | Cinco perfis, separadamente | rotas correspondentes da matriz | Link, botão, input, select, card, upload, menu e diálogo alterados | 375, 1024, 1440 | Percorrer com Tab/Shift+Tab; abrir/fechar menu/diálogo por teclado; inspecionar estados aplicáveis | Ordem visual/DOM, foco inicial/contido/restaurado, alvo e estados atendem FR-001, FR-004–FR-005 e FR-014–FR-015 | Sequência de foco e capturas por perfil |
| Confirmação destrutiva | Organização, acolhedor e administrador, separadamente quando a ação for autorizada | `/dashboard/documentos`; `/dashboard/admin/usuarios` | Documento e conta de teste com ação destrutiva existente | 1024 e 375 | Abrir por teclado, cancelar, fechar por Escape e confirmar em execução separada | Item/consequência identificados; foco inicia em cancelar, fica contido e retorna; cancelamento faz 0 mutações | Captura, registro da ação e resultado por papel |
| Descoberta pública | Visitante | `/`, `/vitrine`, `/animais/$animalId` | Loading, filtro com resultado, vazio e animal sem foto | 375, 1024, 1440 | Aguardar, aplicar/limpar filtro e abrir card | Estrutura preservada; vazio oferece limpar/ajustar filtro quando autorizado; ausência conhecida usa placeholder neutro | Capturas antes/depois por estado |
| Formulários | Visitante, adotante, organização e acolhedor | `/login`, `/cadastro/*`, `/meu-perfil`, `/triagem`, `/dashboard/animais/*` | Campo válido/inválido, ajuda, envio pendente, erro e sucesso | 375, 1024, 1440 | Submeter vazio/inválido, corrigir parcialmente e provocar erro recuperável autorizado | Rótulo/erro associados, valores válidos preservados, foco no primeiro erro e Zod/regra atual preservados | Captura, sequência de foco e resultado por formulário |
| Imagens | Visitante, organização e acolhedor | `/vitrine`, `/animais/$animalId`, `/dashboard/animais/$animalId` | Foto real, ausência conhecida, falha de carregamento e upload existente | 375, 1024, 1440 | Inspecionar texto alternativo; simular falha apenas por ferramenta de rede, sem mudar dados; exercer upload autorizado | Foto real mantida; ausência e falha distintas; nome acessível preservado; Uploadthing inalterado | Captura e registro de rede/resultado sem segredo |
| Filtros e listas | Visitante e administrador | `/vitrine`, `/dashboard/admin/usuarios` | Filtros ativos, limpeza, sem resultados e lista densa | 375, 1024, 1440 | Aplicar/limpar filtro existente e reduzir viewport | Filtro ativo identificável, recuperação disponível e identificação/estado/ação simultâneos sem endpoint novo | Capturas e resultado por estado |
| Leitor de tela | Cinco perfis, em sessões separadas | `/vitrine`, `/cadastro/*`, `/mensagens/$conversaId`, `/dashboard/documentos`, `/dashboard/admin/usuarios` | Menu, filtro, card, formulário, upload, diálogo, status e lista | 375 e 1024 | Percorrer nomes, papéis, erros/status e mudanças de foco com leitor disponível | Nome, papel, estado, erro e foco são compreensíveis sem cor exclusiva | Registro do leitor e rota; se indisponível, registrar indisponibilidade, revisão de HTML/ARIA/ordem no código e pendência explícita para homologação assistiva |

## Validação técnica compatível com a infraestrutura existente

**Automatizada existente:** `npm test` coleta somente `__tests__/**/*.test.ts` em ambiente Node; usá-lo apenas para contratos, schemas, regras de servidor e lógica pura já suportada. Não há infraestrutura reutilizável para renderização React, CSS, viewport, teclado ou diálogos; testes de componente não são validação oficial desta feature.

**Estática e build:** executar `npm run typecheck`, `npm run lint`, `npm run prisma:validate`, `npm run build`, `npm --prefix frontend run build` e lint focado nos arquivos frontend alterados. O lint integral do frontend possui débito CRLF/Prettier preexistente; registrar o resultado sem reformatação massiva.

**Manual/visual:** aplicar a matriz e os procedimentos acima. Nova infraestrutura de UI somente pode ser proposta depois de demonstrar insuficiência dos procedimentos, com custo, benefício, dependências e aprovação explícita; ela não é parte desta feature.

## Aceite final

Após integrar as jornadas, comparar baseline e resultado final por perfil, rota, viewport e estado; confirmar SC-001 a SC-009, cobertura separada dos cinco perfis, contratos/Uploadthing preservados e ausência de alteração em banco, Prisma, migration, seed, backend, autenticação, autorização, HTTP ou regra de negócio. Pedro revisa acessibilidade, regressão e evidências; Arthur revisa aderência à direção visual e aos componentes compartilhados. Registrar rollback aplicado, limitações e evidências finais.

### Execução final parcial — 2026-08-05

O registro detalhado está em [`docs/audits/004-ui-ux-baseline/final/`](../../docs/audits/004-ui-ux-baseline/final/README.md). A inspeção renderizada cobriu os cinco perfis e confirmou ausência de overflow nas combinações executadas em 375/1024/1440 px. A confirmação administrativa teve foco inicial em cancelar, cancelamento sem mutação, restauração de foco e ciclo reversível de toggle com estado original restaurado.

Permanecem como gates explícitos do Draft PR: screenshots pós-implementação comparáveis (timeout da ferramenta), zoom nativo de 200%, leitor de tela real, confirmações de documento por organização/acolhedor sem dado existente e regressão mutável completa das rotas dinâmicas indisponíveis. Nenhum dado foi criado para mascarar essas limitações.
