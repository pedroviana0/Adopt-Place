# Feature Specification: Reforma de UI/UX do AdoptPlace

**Feature Branch**: `004-ui-ux-redesign`
**Created**: 2026-08-05
**Status**: Ready for implementation after baseline gate
**Input**: Auditoria de interface atual e solicitação de reforma de UI/UX sem mudança funcional.

## Clarifications

### Session 2026-08-05

- Q: Como a navegação deve funcionar em mobile? → A: Menu modal ou lateral acessível, adaptado ao papel autenticado, preservando todos os destinos de desktop; barra inferior está fora do escopo.
- Q: Como áreas densas devem se comportar por largura? → A: Listas ou tabelas compactas no desktop; em 375 px, usar cards ou linhas estruturadas quando a tabela produzir rolagem horizontal involuntária ou não permitir visualizar simultaneamente identificação, estado e ação principal.
- Q: Qual é a fonte e a alternativa de imagens de animais? → A: Usar somente fotos reais já associadas aos animais; na ausência, placeholder neutro e coerente com a marca, sem banco de imagens ou conteúdo fictício.
- Q: A reforma pode ampliar capacidades de administração? → A: Busca ou filtros adicionais só podem usar contratos atuais; não ampliar backend para a reforma.
- Q: Qual arquitetura e escopo técnico devem ser preservados? → A: `frontend/` continua a interface TanStack oficial e a raiz Next.js continua backend; não migrar telas, contratos ou regras.
- Q: Como compensar a auditoria originalmente estática? → A: Obter baseline renderizada antes da primeira alteração visual e realizar comparação posterior em 375 px, 1024 px e 1440 px.
- Q: Qual direção de identidade deve ser aplicada? → A: Verde oliva como primária de marca e ações principais, neutros quentes nas superfícies, cores semânticas WCAG 2.2 AA para sucesso/aviso/erro/informação e terracota apenas como acento secundário opcional nos usos delimitados em “Direção visual verificável”.

## Direção visual verificável

- **Verde oliva**: permanece a assinatura da marca e a cor de ação primária, seleção e navegação ativa. Estados de sucesso, aviso, erro e informação usam cores semânticas próprias e nunca são comunicados somente pelo oliva ou por qualquer outra cor.
- **Neutros quentes**: aplicam-se a fundo geral, cards, campos, divisores, texto secundário e superfícies elevadas. Devem evitar cinza azulado predominante, branco frio em todas as superfícies, bege amarelado que reduza contraste e aparência sépia/envelhecida.
- **Terracota**: acento opcional limitado a pequenos detalhes editoriais, ilustrações ou destaques não críticos. Não substitui o oliva, não ocupa grandes superfícies, não é indicador exclusivo de estado, não colore todos os botões e não pode virar decoração repetitiva.
- **Estilos excluídos**: visual infantil ou de pet shop, gamificação, gradientes chamativos, sombras fortes, excesso de raios grandes e badges cuja informação dependa apenas da cor.
- **Escolha dos valores**: os valores finais dos tokens serão definidos somente depois da baseline e devem satisfazer FR-015; esta especificação não fixa códigos prematuramente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar por qualquer dispositivo (Priority: P1)

Como visitante ou pessoa autenticada, quero alcançar os destinos permitidos para meu perfil em telas pequenas, médias e grandes para continuar minha jornada sem perder orientação.

**Why this priority**: a navegação é pré-requisito para todas as jornadas e a auditoria evidenciou que os destinos principais deixam de estar visíveis abaixo do breakpoint de desktop.

**Independent Test**: em 375 px, 1024 px e 1440 px, percorrer por teclado os destinos disponíveis para visitante, adotante, organização, acolhedor independente e administrador, com sessão e evidência separadas para cada papel.

**Acceptance Scenarios**:

1. **Given** um visitante em uma tela de 375 px, **When** abrir o menu modal ou lateral, **Then** consegue alcançar Início, Adoção, Entrar e Cadastro sem rolagem horizontal involuntária.
2. **Given** uma sessão de adotante, organização, acolhedor independente ou administrador, **When** navegar pela interface em qualquer largura-alvo, **Then** encontra somente os destinos autorizados para seu papel e reconhece o destino atual por texto e mais um indicador perceptível além de cor.
3. **Given** a navegação aberta por teclado, **When** ela recebe foco, é percorrida ou fechada por Escape/controle explícito, **Then** o foco inicial entra no primeiro destino disponível, permanece contido enquanto modal e retorna ao controle que abriu a navegação.

---

### User Story 2 - Executar ações com feedback e segurança (Priority: P1)

Como organização, acolhedor independente ou administrador, quero receber estados verificáveis de carregamento, sucesso, erro e confirmação para agir com segurança sobre animais, documentos, solicitações e contas.

**Why this priority**: ações de alto impacto e listas operacionais concentram risco de erro, especialmente exclusões e alterações de conta.

**Independent Test**: acionar uma operação assíncrona bem-sucedida, uma falha recuperável e uma ação destrutiva em cada jornada operacional afetada; confirmar feedback, recuperação e ausência de mutação antes da confirmação.

**Acceptance Scenarios**:

1. **Given** uma ação destrutiva disponível, **When** a pessoa inicia a ação, **Then** vê a consequência e o item afetado antes de confirmar; cancelar não altera dados.
2. **Given** uma confirmação aberta, **When** usar teclado, **Then** o foco inicial fica na ação segura de cancelar, permanece contido na decisão, pode fechar por Escape e retorna ao gatilho.
3. **Given** uma consulta ou mutação falha, **When** o erro é exibido, **Then** a pessoa recebe mensagem compreensível e uma próxima ação aplicável, sem expor dados sensíveis.

---

### User Story 3 - Descobrir animais com clareza (Priority: P2)

Como visitante, quero explorar a vitrine pública com filtros, cards e estados estáveis para compreender os animais disponíveis e chegar ao perfil desejado.

**Why this priority**: descoberta é a principal entrada de adoção e a auditoria identificou carregamento que não preserva a grade e cards sem alternativa quando falta foto.

**Independent Test**: abrir a vitrine em cada largura-alvo, carregar resultados, aplicar/remover filtros, obter resultado vazio e abrir um card com e sem foto principal.

**Acceptance Scenarios**:

1. **Given** a vitrine está carregando, **When** aguardar os resultados, **Then** filtros e colunas da grade mantêm o espaço correspondente ao conteúdo final e os cards substituem seus slots sem colapsar ou recriar a região de resultados.
2. **Given** filtros selecionados sem resultados, **When** a busca termina, **Then** a pessoa entende a causa e recebe uma ação para ajustar ou limpar filtros.
3. **Given** um animal sem foto principal, **When** seu card é exibido, **Then** há placeholder identificado como ausência de foto; se uma foto existente falhar ao carregar, a mensagem diferencia falha de carregamento de ausência conhecida, sem ocultar nome e ação de abrir o perfil.

---

### User Story 4 - Usar jornadas autenticadas em contexto operacional (Priority: P2)

Como adotante, organização, acolhedor ou administrador, quero interfaces responsivas e legíveis para concluir minhas tarefas homologadas sem alteração de permissões ou regras.

**Why this priority**: dashboard, solicitações, saúde, documentos, mensagens e administração concentram informação e devem funcionar em telas menores sem perder eficácia.

**Independent Test**: para cada papel, executar uma tarefa já homologada na sua rota autorizada em 375 px, 1024 px e 1440 px; confirmar que controles, informação crítica e recuperação de erro permanecem alcançáveis.

**Acceptance Scenarios**:

1. **Given** uma lista operacional sem itens, **When** ela termina de carregar, **Then** mostra orientação específica e a próxima ação autorizada, em vez de somente uma frase genérica.
2. **Given** uma lista ou tabela com dados, **When** em 375 px a tabela produzir rolagem horizontal involuntária ou não exibir simultaneamente identificação, estado e ação principal, **Then** a pessoa acessa esses elementos em cards ou linhas estruturadas.
3. **Given** uma conversa arquivada, documento privado ou área restrita, **When** a tela é exibida, **Then** a apresentação mantém as regras existentes de leitura, privacidade e autorização.

---

### User Story 5 - Perceber uma interface consistente e acessível (Priority: P3)

Como qualquer pessoa usuária, quero reconhecer ações, estados e prioridade visual de forma consistente para usar o AdoptPlace com menos esforço e sem depender de cor ou ponteiro.

**Why this priority**: a reforma é transversal; sua entrega estabiliza os padrões usados pelas jornadas prioritárias sem alterar seu comportamento.

**Independent Test**: revisar a população de homologação nomeada neste documento, seus componentes compartilhados modificados e a matriz de `quickstart.md` com teclado, contraste, zoom de 200% e os três tamanhos de viewport.

**Acceptance Scenarios**:

1. **Given** um controle interativo recebe foco, **When** a pessoa navega por teclado, **Then** o foco é visível e contínuo em todos os controles, links, menus, filtros e cards acionáveis.
2. **Given** estados de sucesso, alerta, erro, seleção ou indisponibilidade, **When** são exibidos, **Then** possuem texto, ícone, forma ou outra pista além de cor.
3. **Given** uma tela principal em 200% de zoom, **When** a pessoa interage, **Then** conteúdo, foco e ação principal continuam acessíveis sem perda de informação nem rolagem horizontal involuntária.

### Edge Cases

- Catálogo, vitrine, lista, mensagem ou documento indisponível temporariamente deve oferecer estado de erro recuperável sem limpar informação já exibida indevidamente.
- Ação submetida mais de uma vez enquanto está pendente deve comunicar processamento e impedir duplicação visual, preservando a proteção já existente no servidor.
- Textos extensos (nome de animal, documento, organização ou e-mail), menus e diálogos devem refluir em 200% de zoom, sem sobrepor ações nem exigir rolagem horizontal da página.
- Navegação com muitos destinos de organização ou acolhedor deve manter cada destino alcançável, inclusive quando o foco inicia ou retorna de um diálogo.
- Ausência de imagem, zero resultados, conta inativa, conversa arquivada e operação não autorizada devem manter mensagens corretas sem revelar dados privados.
- Falha de carregamento de uma foto existente deve usar estado diferente do placeholder de ausência conhecida e preservar nome/texto alternativo do animal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A interface DEVE disponibilizar, em 375 px, 1024 px e 1440 px, todos os destinos atualmente permitidos para visitante, adotante, organização, acolhedor independente e administrador sem remover nem conceder permissões. Em mobile, DEVE usar menu modal ou lateral, nunca barra inferior; ao abrir por teclado, o foco entra no primeiro destino, permanece contido enquanto o menu for modal, fecha por Escape ou controle explícito e retorna ao acionador.
- **FR-002**: A interface DEVE indicar o destino de navegação atual por pelo menos dois sinais perceptíveis: o nome textual/`aria-current` e um segundo indicador visível como marcador, ícone, sublinhado, borda ou forma, sem depender somente de cor.
- **FR-003**: A interface DEVE fornecer baseline visual renderizada de todas as rotas da “População de homologação” antes da primeira alteração visual e comparação posterior, cobrindo 375 px, 1024 px e 1440 px.
- **FR-004**: Toda ação destrutiva no escopo — exclusão de documento e desativação/reativação administrativa, além de outra ação destrutiva já existente que seja visualmente alterada — DEVE identificar item e consequência, oferecer ação principal e cancelamento inequívocos, iniciar o foco na ação segura, conter o foco enquanto modal e não executar mutação antes da confirmação.
- **FR-005**: Após fechar menu, confirmação, erro ou outro fluxo modal por cancelamento, Escape ou conclusão, a interface DEVE restaurar o foco ao controle que iniciou a interação quando ele ainda estiver disponível; se removido, o foco deve ir ao próximo controle lógico do mesmo contexto.
- **FR-006**: Nas consultas e mutações enumeradas em “Cobertura de estados e formulários”, consultas DEVEM distinguir carregamento/skeleton, conteúdo, vazio e erro recuperável; mutações DEVEM impedir reenvio visual enquanto pendentes, preservar dados digitados em erro, oferecer nova tentativa quando segura e comunicar sucesso por mensagem persistente no contexto ou anúncio em região viva acessível. Esses estados não alteram a proteção autoritativa do servidor.
- **FR-007**: Estados vazios DEVEM explicar o contexto e apresentar a próxima ação somente quando ela existir e for autorizada. A ação DEVE ser omitida quando não houver ação válida, quando o papel não tiver permissão ou quando sua exposição violar privacidade; não deve ser substituída por controle enganoso desabilitado.
- **FR-008**: A home e a vitrine pública DEVEM preservar a estrutura visual dos filtros e resultados enquanto os dados carregam, sem colapsar ou recriar a grade de forma que desloque o conteúdo principal.
- **FR-009**: A vitrine DEVE explicar resultados vazios e permitir retornar a uma busca ampla sem memorização de filtros anteriores.
- **FR-010**: Cards de animal sem foto principal DEVEM fornecer placeholder neutro identificado como “sem foto”. Fotos exibidas DEVEM ser as reais já associadas aos animais, com texto alternativo que identifique o animal; imagens decorativas usam `alt` vazio. Falha ao carregar foto existente DEVE ser comunicada como falha, distinta da ausência conhecida, sem banco de imagens ou conteúdo fictício e sem alterar Uploadthing ou o fluxo homologado.
- **FR-011**: Telas autenticadas DEVEM reorganizar conteúdo denso para as três larguras-alvo sem ocultar informação, estado ou ação principal; listas ou tabelas permanecem compactas no desktop e, em 375 px, adotam cards ou linhas estruturadas quando a tabela produzir rolagem horizontal involuntária ou não exibir simultaneamente identificação, estado e ação principal.
- **FR-012**: Listas de animais, favoritos, solicitações, saúde, documentos, mensagens e usuários DEVEM distinguir identificação, estado, metadados e ação principal sem depender exclusivamente de badges coloridos. Filtros ativos DEVEM ser identificáveis, poder ser limpos e produzir estado sem resultados com recuperação. Busca ou filtros administrativos adicionais só são permitidos quando atendidos pelos contratos existentes; necessidade de backend deve ser registrada como bloqueio fora do escopo, sem endpoint novo nesta feature.
- **FR-013**: A interface DEVE manter verde oliva como assinatura primária, neutros quentes em superfícies e cores semânticas acessíveis para sucesso, aviso, erro e informação; terracota é apenas acento secundário discreto.
- **FR-014**: Todos os links, botões, campos, selects, menus, diálogos, filtros, cards acionáveis e controles de upload alterados DEVEM seguir ordem de foco compatível com a ordem visual/DOM, ter `focus-visible` perceptível e continuidade/restauração de foco. Controles não inline DEVEM ter alvo de pelo menos 24 × 24 CSS px, ou espaçamento que permita um alvo circular de 24 px sem sobrepor alvo adjacente, conforme WCAG 2.5.8; exceções limitam-se a links inline, controles definidos pelo agente de usuário e apresentações em que o tamanho é essencial, e DEVEM ser registradas na matriz de homologação.
- **FR-015**: Texto normal sobre superfície DEVE atingir contraste de 4,5:1; texto grande, componentes gráficos essenciais, limites de controles e indicadores de foco DEVEM atingir 3:1, conforme WCAG 2.2 AA. A matriz DEVE cobrir texto/superfície, ação primária, foco, erro, aviso, sucesso, informação, seleção e estado desabilitado aplicável. Cada estado deve comunicar significado por texto, ícone, forma ou outra pista além de cor; exceções normativas, como controles inativos, devem ser registradas.
- **FR-016**: A reforma DEVE preservar `frontend/` como interface oficial, a raiz como backend, e todas as rotas, contratos HTTP, autenticação, autorização, dados exibidos por papel, Uploadthing e regras de negócio homologadas na feature 003.
- **FR-017**: A reforma NÃO DEVE exigir alteração de banco, Prisma, migration, seed, autenticação, autorização, contratos HTTP, endpoints ou regras de persistência.
- **FR-018**: Formulários alterados de login, cadastro, perfil, triagem e gestão de animais DEVEM preservar schemas Zod e regras atuais, manter rótulo/nome acessível, agrupar campos relacionados, associar ajuda e erro ao campo, preservar valores válidos após erro e posicionar foco no primeiro erro na submissão inválida. Progressão em múltiplas etapas só pode refletir etapas já existentes.
- **FR-019**: Controles alterados DEVEM possuir nome acessível; mensagens de erro, sucesso e mudança de estado assíncrono DEVEM estar programaticamente associadas ao controle ou anunciadas por região viva apropriada, sem expor dado privado.

### Non-Functional Requirements

- **NFR-001**: Em 375 px, 1024 px e 1440 px, nenhuma rota da população definida em “População de homologação” pode apresentar rolagem horizontal da página. Não há exceção planejada: conteúdo tabular que não preserve simultaneamente identificação, estado e ação principal deve usar cards/linhas estruturadas; uma exceção essencial exigiria bloqueio e alteração documental de escopo.
- **NFR-002**: Em 200% de zoom, cada rota da população deve manter conteúdo, foco e ações essenciais disponíveis; textos longos, menus e diálogos devem refluir sem sobreposição, corte de informação ou rolagem horizontal da página.
- **NFR-003**: A validação de qualidade deve cobrir estado padrão, hover, focus-visible, selected, disabled, loading, skeleton, vazio, erro, sucesso, teclado, ordem/restauração de foco, contraste e ações destrutivas nos componentes em que cada estado se aplica.
- **NFR-004**: A baseline e a homologação visual devem usar apenas dados e contas de teste já autorizados, sem expor credenciais, tokens, cookies ou informação privada.

### Constitution Requirements *(mandatory)*

- **CR-001**: A especificação limita padrões compartilhados ao que for reutilizado por ao menos duas jornadas ou necessário para um requisito atual.
- **CR-002**: A feature não altera entidades persistidas; qualquer constatação futura de dado ausente é bloqueio de escopo e não autoriza alteração de schema.
- **CR-003**: Regras de adoção, autenticação, autorização, privacidade, validação confiável e persistência continuam exclusivamente no backend já homologado.
- **CR-004**: A interface consome somente contratos HTTP e DTOs existentes; não acessa banco, Prisma, credenciais ou dados privados fora da autorização atual.
- **CR-005**: Validações de interface continuam como feedback de UX e não substituem a validação confiável existente.
- **CR-006**: Estado adicional no cliente limita-se a apresentação e interação transitória; não cria fonte de verdade de produto.
- **CR-007**: Nenhuma dependência nova é requisito desta feature; qualquer proposta futura exige demonstrar que o stack atual não atende à necessidade.
- **CR-008**: Implementação e testes mantêm TypeScript strict e não introduzem `any` explícito.

### Key Entities

- **Pessoa usuária por papel**: visitante, adotante, organização, acolhedor e administrador; suas permissões e rotas existentes permanecem fonte de verdade.
- **Estado de experiência**: apresentação transitória de carregamento, vazio, erro, sucesso, foco, seleção, desabilitado e confirmação; não representa dado persistido.
- **Jornada homologada**: fluxo já integrado entre interface e contrato protegido/público, incluindo vitrine, cadastro, triagem, animais, solicitações, saúde, documentos, mensagens e administração.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos destinos disponíveis para cada papel no desktop podem ser alcançados por teclado em 375 px, 1024 px e 1440 px.
- **SC-002**: 0 rotas da população de homologação apresentam rolagem horizontal da página em 375 px, 1024 px, 1440 px ou 200% de zoom.
- **SC-003**: 100% dos controles interativos modificados e dos controles acionáveis enumerados na matriz de homologação exibem foco visível e contínuo por teclado nos estados aplicáveis.
- **SC-004**: 100% das ações destrutivas afetadas exigem confirmação contextual; em teste de cancelamento, 0 mutações são realizadas.
- **SC-005**: 100% dos carregamentos públicos de `/` e `/vitrine` preservam a estrutura final da grade durante a espera.
- **SC-006**: 100% dos estados vazio e erro listados na matriz de homologação informam contexto e apresentam recuperação ou próxima ação quando ela é autorizada.
- **SC-007**: 100% das combinações semânticas enumeradas em FR-015 e dos estados críticos listados na matriz de homologação comunicam significado por meio adicional à cor e aprovam contraste WCAG 2.2 AA.
- **SC-008**: A regressão dos fluxos homologados da feature 003 passa sem mudança de contrato, permissão, regra de negócio, banco ou autenticação.
- **SC-009**: 100% dos formulários alterados enumerados em FR-018 preservam validação existente, associam rótulo/ajuda/erro, mantêm valores válidos após falha e direcionam foco ao primeiro erro na submissão inválida.

## Traceability to Audit

| Achado da auditoria | Requisitos iniciais |
|---|---|
| UX-01 | FR-001, FR-002, NFR-001, SC-001 |
| UX-02 | FR-004, FR-005, FR-006, SC-004 |
| UX-03 | FR-006, FR-007, SC-006 |
| UX-04 | FR-006, FR-008, SC-005 |
| UX-05 | FR-010, SC-007 |
| UX-06 | FR-013, FR-015, CR-001 |
| UX-07 | FR-006, FR-009, SC-006 |
| UX-08 | FR-001, FR-011, NFR-001 |
| UX-09 | FR-011, FR-012, FR-004 |
| UX-10 | FR-014, FR-015, NFR-002, SC-003 |

## Cobertura de estados e formulários

| Jornada/rota | População de estados obrigatória | Formulários/controles |
|---|---|---|
| `/`, `/vitrine`, `/animais/$animalId` | loading/skeleton, conteúdo, filtros ativos, vazio, erro, sucesso de recuperação, foto ausente e foto com falha | filtros, cards e links de detalhe |
| `/login`, `/cadastro/*` | padrão, hover, focus-visible, disabled, envio pendente, erro de campo/formulário e sucesso | login e cadastros de adotante, organização e acolhedor |
| `/meu-perfil`, `/triagem` | padrão, hover, focus-visible, disabled, envio pendente, erro e sucesso | perfil e triagem |
| `/meus-favoritos`, `/minhas-solicitacoes`, `/mensagens/*` | loading, conteúdo, vazio, erro, selected, disabled e estado arquivado aplicável | listas, ações e conversa |
| `/dashboard`, `/dashboard/perfil` | padrão, hover, focus-visible, loading, envio pendente, erro e sucesso aplicáveis | shell operacional, resumo e perfil de organização/acolhedor |
| `/dashboard/animais/*` | loading, conteúdo, vazio, erro, envio pendente, sucesso e falha de upload | formulário de animal, fotos e relações |
| `/dashboard/solicitacoes/*`, `/dashboard/saude`, `/dashboard/documentos`, `/dashboard/mensagens/*` | loading, conteúdo, vazio, erro, sucesso, selected, disabled e confirmação aplicável | listas, formulários, documentos e conversa |
| `/dashboard/admin/usuarios` | loading, conteúdo, vazio, erro, sucesso, selected, disabled e confirmação | lista e ativação/desativação |

## População de homologação

As rotas e famílias da população são: `/`, `/vitrine`, `/animais/$animalId`, `/login`, `/cadastro`, `/cadastro/adotante`, `/cadastro/organizacao`, `/cadastro/acolhedor`, `/meu-perfil`, `/triagem`, `/meus-favoritos`, `/minhas-solicitacoes`, `/mensagens`, `/mensagens/$conversaId`, `/dashboard`, `/dashboard/perfil`, `/dashboard/animais`, `/dashboard/animais/novo`, `/dashboard/animais/$animalId`, `/dashboard/solicitacoes`, `/dashboard/solicitacoes/$solicitacaoId`, `/dashboard/saude`, `/dashboard/documentos`, `/dashboard/mensagens`, `/dashboard/mensagens/$conversaId` e `/dashboard/admin/usuarios`. A matriz em `quickstart.md` define perfil, controles, estados e evidência. Visitante, adotante, organização, acolhedor independente e administrador são populações separadas de validação, mesmo quando organização e acolhedor usam a mesma rota ou componente. Uma rota existente só entra nesta população quando for alterada pela feature ou consumir componente compartilhado alterado; a inclusão deve ocorrer antes da mudança visual e atualizar a matriz, requisitos e tarefa correspondente.

## Dependencies

- A baseline visual e a comparação posterior precisam de ambiente de interface renderizada e contas de teste autorizadas; a auditoria original não conseguiu produzir essa evidência.
- As rotas, DTOs, contratos HTTP, sessão e permissões certificados na feature 003 permanecem disponíveis e são a referência de regressão.
- A reforma depende da constituição 1.2.0, que reconhece `frontend/` como interface oficial e o backend raiz como autoridade confiável.

## Assumptions

- O verde oliva atual permanece a assinatura primária; neutros quentes, cores semânticas acessíveis e terracota como acento secundário discreto não competem com a ação principal.
- A baseline visual será capturada antes da primeira alteração visual, comparada depois e armazenada sem dados privados ou segredos.
- Fotos reais associadas a animais permanecem a única fonte de imagem de animal; ausência de foto usa placeholder neutro de marca.
- Não é necessário criar novas capacidades de produto para atender aos requisitos; a reforma aplica padrões às jornadas existentes.
- A priorização pode migrar tela a tela após planejamento, mas não reduz os critérios transversais de acessibilidade e regressão.

## Out of Scope

- Novas regras de adoção, novos fluxos de produto, alteração de entidades, banco, Prisma, migrations ou seeds.
- Alteração de autenticação, autorização, NextAuth, contratos HTTP, DTOs ou regra confiável no backend; ampliação de backend para busca ou filtros administrativos.
- Reescrita do frontend, troca de arquitetura, retorno ao `legacy/frontend-antigo/` ou dependências novas sem justificativa aprovada.
- Implementação fora das ondas, dependências, arquivos e critérios documentados para a feature 004.
