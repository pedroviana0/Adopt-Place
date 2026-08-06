# Validação final parcial — feature 004

Data: 2026-08-05
Branch: `004-101-mobile-navigation`
Base de integração: `004-ui-ux-redesign` em `b11b2a5`

## Reauditoria pos-integracao — 2026-08-06

O merge do PR #113 foi confirmado em `ff50bb1` na branch integradora `004-ui-ux-redesign`. Nesta reauditoria, `npm test` passou com 46 arquivos e 223 testes; `npm run typecheck`, `npm run lint`, `npm run prisma:validate` e `npm --prefix frontend run build` tambem passaram. O build da raiz compilou e concluiu a checagem de tipos, mas falhou durante a coleta de paginas com `Cannot find module './chunks/vendor-chunks/next.js'` sob o diretorio `.next` enquanto `next dev` estava ativo. O ambiente nao permitiu pausar esse processo, portanto esse build deve ser repetido com o servidor raiz parado antes de qualquer aceite.

Nao havia navegador controlavel neste ambiente para repetir as sessoes autenticadas, capturas pos-implementacao, teclado, zoom nativo de 200% ou leitor de tela. Nenhum desses cenarios foi inferido como aprovado. Permanecem pendentes T014, T017, T019, T026, T027, T033, T039, T043, T044, T045 e T049; por isso esta evidencia nao autoriza fechar as Issues de entrega nem tornar a feature pronta para merge em `main`.

O lint integral do frontend foi repetido e reportou 13.652 erros e 7 avisos de CRLF/Prettier. Esse debito preexistente permanece separado da feature; nenhuma formatacao massiva foi aplicada.

## Resultado renderizado

A interface foi inspecionada no frontend oficial em `http://127.0.0.1:8080`, usando somente as contas de teste preexistentes. Nenhuma credencial, cookie ou token foi registrado. As medições abaixo usam a largura real do viewport e comparam `scrollWidth` e `clientWidth` do documento.

| Perfil | Rotas verificadas | Viewports | Rolagem horizontal da página |
|---|---|---|---|
| Visitante | `/vitrine` e controles de filtro/card | 375, 1024 e 1440 px | 0 ocorrências |
| Adotante | `/meu-perfil`, `/triagem`, `/meus-favoritos`, `/minhas-solicitacoes`, `/mensagens` | 375, 1024 e 1440 px | 0 ocorrências |
| Organização | `/dashboard`, `/dashboard/perfil`, `/dashboard/animais`, `/dashboard/animais/novo`, `/dashboard/solicitacoes`, `/dashboard/saude`, `/dashboard/documentos`, `/dashboard/mensagens` | 375, 1024 e 1440 px | 0 ocorrências em 24 combinações |
| Acolhedor independente | mesmas oito rotas operacionais, em sessão própria | 375, 1024 e 1440 px | 0 ocorrências em 24 combinações |
| Administrador | `/dashboard/admin/usuarios` | 375, 1024 e 1440 px | 0 ocorrências |

Na vitrine, o filtro selecionado expôs `aria-pressed`, a quantidade de filtros ativos e a ação de limpeza; fotos reais mantiveram texto alternativo com o nome do animal. O menu mobile e o shell operacional expuseram os destinos autorizados por papel sem barra inferior.

## Confirmação e foco

Em `/dashboard/admin/usuarios`, a confirmação foi aberta por uma ação real em 375 px. O foco inicial ficou em **Cancelar**, o item e a consequência foram anunciados no diálogo e, após o cancelamento, o foco retornou ao botão que abriu o diálogo. O cancelamento manteve o estado da conta. Um ciclo completo de desativação e reativação foi executado em uma conta de teste e terminou com o estado original restaurado.

A organização autenticada não possuía documento no estado de teste, portanto a confirmação de exclusão em `/dashboard/documentos` não pôde ser exercida sem criar dados. O acolhedor também permanece pendente para esse cenário. O componente é o mesmo já validado no fluxo administrativo, mas a homologação por permissão não é considerada concluída por inferência.

## Achado durante a validação

A primeira abertura da administração revelou avaliação antecipada de `query.data.map(...)` enquanto o carregamento ainda estava ativo. O mesmo padrão existia nas listas de solicitações, documentos e agenda. O achado foi corrigido apenas nessas quatro rotas com fallback para lista vazia; a administração voltou a renderizar com dados reais e o build permaneceu aprovado.

## Verificações técnicas

| Verificação | Resultado |
|---|---|
| Testes raiz | 46 arquivos e 223 testes aprovados |
| TypeScript strict raiz | aprovado |
| Lint raiz | aprovado |
| Prisma validate | aprovado; schema inalterado |
| Build Next.js | aprovado após pausar somente o servidor de desenvolvimento concorrente e restaurá-lo |
| Build frontend | aprovado; apenas avisos informativos já conhecidos |
| Lint focado | 29 arquivos, 0 erros e 1 aviso estrutural de Fast Refresh em `AnimalFilters.tsx` |
| Lint integral frontend | débito preexistente reproduzido: 8.244 erros de CRLF/Prettier e 7 avisos; nenhuma formatação massiva aplicada |
| `git diff --check` | deve ser executado novamente no gate de publicação |

## Comparação e limitações

A baseline anterior continua disponível em [`../before/`](../before/) e as evidências das fundações, navegação e shell em [`../issue-100/`](../issue-100/) e [`../issue-101-102/`](../issue-101-102/). O navegador interno confirmou layout, semântica, foco e ausência de overflow, mas a captura pós-implementação falhou repetidamente por timeout no comando de screenshot. Assim, a comparação PNG final (T049) permanece pendente e não foi substituída por evidência inventada.

O navegador interno também não oferece zoom nativo de 200%, e não havia leitor de tela disponível. Foi feita revisão de HTML/ARIA/ordem para menus, filtros, cards, formulários, upload, chats, listas e diálogos; zoom de 200% e homologação assistiva real continuam pendentes para aceite final. Rotas dinâmicas sem dados preexistentes, upload, falha de imagem por rede, chats arquivados e regressões mutáveis completas não foram fabricados nem povoados.

## Escopo preservado

Não houve alteração em backend, banco, Prisma, migrations, seeds, autenticação, autorização, contratos HTTP, DTOs, regras de negócio, UploadThing ou `legacy/frontend-antigo/`. A mudança limita-se à apresentação e interação no frontend oficial e à documentação da feature 004.
