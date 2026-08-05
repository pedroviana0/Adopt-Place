# Feature Specification: Reforma de UI/UX do AdoptPlace

**Feature Branch**: `004-ui-ux-redesign`
**Created**: 2026-08-05
**Status**: Draft
**Input**: Auditoria de interface atual e solicitação de reforma de UI/UX sem mudança funcional.

## Clarifications

### Session 2026-08-05

- Q: Como a navegação deve funcionar em mobile? → A: Menu modal ou lateral acessível, adaptado ao papel autenticado, preservando todos os destinos de desktop; barra inferior está fora do escopo.
- Q: Como áreas densas devem se comportar por largura? → A: Listas ou tabelas compactas no desktop; em 375 px, usar cards ou linhas estruturadas quando a tabela produzir rolagem horizontal involuntária ou não permitir visualizar simultaneamente identificação, estado e ação principal.
- Q: Qual é a fonte e a alternativa de imagens de animais? → A: Usar somente fotos reais já associadas aos animais; na ausência, placeholder neutro e coerente com a marca, sem banco de imagens ou conteúdo fictício.
- Q: A reforma pode ampliar capacidades de administração? → A: Busca ou filtros adicionais só podem usar contratos atuais; não ampliar backend para a reforma.
- Q: Qual arquitetura e escopo técnico devem ser preservados? → A: `frontend/` continua a interface TanStack oficial e a raiz Next.js continua backend; não migrar telas, contratos ou regras.
- Q: Como compensar a auditoria originalmente estática? → A: Obter baseline renderizada antes da primeira alteração visual e realizar comparação posterior em 375 px, 1024 px e 1440 px.
- Q: Qual direção de identidade deve ser aplicada? → A: Verde oliva como primária, neutros quentes nas superfícies, semânticas acessíveis para sucesso/aviso/erro/informação e terracota apenas como acento secundário discreto.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar por qualquer dispositivo (Priority: P1)

Como visitante ou pessoa autenticada, quero alcançar os destinos permitidos para meu perfil em telas pequenas, médias e grandes para continuar minha jornada sem perder orientação.

**Why this priority**: a navegação é pré-requisito para todas as jornadas e a auditoria evidenciou que os destinos principais deixam de estar visíveis abaixo do breakpoint de desktop.

**Independent Test**: em 375 px, 1024 px e 1440 px, percorrer por teclado os destinos disponíveis para visitante, adotante, responsável e administrador e confirmar que todos continuam alcançáveis e identificáveis.

**Acceptance Scenarios**:

1. **Given** um visitante em uma tela de 375 px, **When** abrir o menu modal ou lateral, **Then** consegue alcançar Início, Adoção, Entrar e Cadastro sem rolagem horizontal involuntária.
2. **Given** uma sessão de adotante, responsável ou administrador, **When** navegar pela interface em qualquer largura-alvo, **Then** encontra somente os destinos autorizados para seu papel e reconhece o destino atual sem depender apenas de cor.
3. **Given** a navegação aberta por teclado, **When** avançar e retornar pelo foco ou fechar o menu, **Then** o foco permanece visível, previsível e retorna ao controle que abriu a navegação.

---

### User Story 2 - Executar ações com feedback e segurança (Priority: P1)

Como responsável ou administrador, quero receber estados claros de carregamento, sucesso, erro e confirmação para agir com segurança sobre animais, documentos, solicitações e contas.

**Why this priority**: ações de alto impacto e listas operacionais concentram risco de erro, especialmente exclusões e alterações de conta.

**Independent Test**: acionar uma operação assíncrona bem-sucedida, uma falha recuperável e uma ação destrutiva em cada jornada operacional afetada; confirmar feedback, recuperação e ausência de mutação antes da confirmação.

**Acceptance Scenarios**:

1. **Given** uma ação destrutiva disponível, **When** a pessoa inicia a ação, **Then** vê a consequência e o item afetado antes de confirmar; cancelar não altera dados.
2. **Given** uma confirmação aberta, **When** usar teclado, **Then** o foco fica contido na decisão, há alternativa inequívoca de cancelar e, ao fechar, o foco retorna ao gatilho.
3. **Given** uma consulta ou mutação falha, **When** o erro é exibido, **Then** a pessoa recebe mensagem compreensível e uma próxima ação aplicável, sem expor dados sensíveis.

---

### User Story 3 - Descobrir animais com clareza (Priority: P2)

Como visitante, quero explorar a vitrine pública com filtros, cards e estados estáveis para compreender os animais disponíveis e chegar ao perfil desejado.

**Why this priority**: descoberta é a principal entrada de adoção e a auditoria identificou carregamento que não preserva a grade e cards sem alternativa quando falta foto.

**Independent Test**: abrir a vitrine em cada largura-alvo, carregar resultados, aplicar/remover filtros, obter resultado vazio e abrir um card com e sem foto principal.

**Acceptance Scenarios**:

1. **Given** a vitrine está carregando, **When** aguardar os resultados, **Then** a estrutura da grade final permanece reservada e não ocorre deslocamento visual relevante ao substituir o carregamento pelos cards.
2. **Given** filtros selecionados sem resultados, **When** a busca termina, **Then** a pessoa entende a causa e recebe uma ação para ajustar ou limpar filtros.
3. **Given** um animal sem foto principal, **When** seu card é exibido, **Then** há representação neutra identificável que não aparenta erro nem oculta o nome e a ação de abrir o perfil.

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
- Textos extensos (nome de animal, documento, organização ou e-mail) devem permanecer identificáveis e não sobrepor ações em qualquer largura-alvo.
- Navegação com muitos destinos de responsável deve manter cada destino alcançável, inclusive quando o foco inicia ou retorna de um diálogo.
- Ausência de imagem, zero resultados, conta inativa, conversa arquivada e operação não autorizada devem manter mensagens corretas sem revelar dados privados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A interface DEVE disponibilizar, em 375 px, 1024 px e 1440 px, todos os destinos atualmente permitidos para cada papel sem remover nem conceder permissões; em mobile, deve usar menu modal ou lateral acessível e não barra inferior.
- **FR-002**: A interface DEVE indicar o destino de navegação atual por pelo menos dois sinais perceptíveis.
- **FR-003**: A interface DEVE fornecer baseline visual renderizada das rotas principais antes da primeira alteração visual e comparação posterior, cobrindo 375 px, 1024 px e 1440 px.
- **FR-004**: Toda ação destrutiva DEVE exigir confirmação contextual explícita, oferecer cancelamento e não executar mutação antes da confirmação.
- **FR-005**: Após fechar confirmação, erro ou fluxo modal, a interface DEVE restaurar o foco ao controle que iniciou a interação quando ele ainda estiver disponível.
- **FR-006**: Consultas e mutações assíncronas nas jornadas afetadas DEVEM apresentar carregamento, sucesso ou erro compatíveis com a ação e uma recuperação ou próxima ação quando aplicável.
- **FR-007**: Estados vazios DEVEM explicar o contexto e, quando a pessoa tiver permissão, apresentar a próxima ação autorizada.
- **FR-008**: A vitrine pública DEVE preservar a estrutura visual dos filtros e resultados enquanto os dados carregam.
- **FR-009**: A vitrine DEVE explicar resultados vazios e permitir retornar a uma busca ampla sem memorização de filtros anteriores.
- **FR-010**: Cards de animal sem foto principal DEVEM fornecer placeholder neutro e coerente com a marca; fotos exibidas DEVEM ser as reais já associadas aos animais, sem banco de imagens ou conteúdo fictício.
- **FR-011**: Telas autenticadas DEVEM reorganizar conteúdo denso para as três larguras-alvo sem ocultar informação, estado ou ação principal; listas ou tabelas permanecem compactas no desktop e, em 375 px, adotam cards ou linhas estruturadas quando a tabela produzir rolagem horizontal involuntária ou não exibir simultaneamente identificação, estado e ação principal.
- **FR-012**: Listas de documentos, usuários e demais áreas operacionais afetadas DEVEM distinguir estado, metadados e ação sem depender exclusivamente de badges coloridos; busca ou filtros administrativos adicionais só são permitidos quando atendidos pelos contratos existentes.
- **FR-013**: A interface DEVE manter verde oliva como assinatura primária, neutros quentes em superfícies e cores semânticas acessíveis para sucesso, aviso, erro e informação; terracota é apenas acento secundário discreto.
- **FR-014**: Todos os elementos interativos afetados DEVEM ter foco de teclado visível e continuidade de foco. Controles não inline DEVEM ter alvo de pelo menos 24 × 24 CSS px, ou espaçamento que permita um alvo circular de 24 px sem sobrepor alvo adjacente, conforme WCAG 2.5.8; exceções limitam-se a links inline, controles definidos pelo agente de usuário e apresentações em que o tamanho é essencial, e DEVEM ser registradas na matriz de homologação.
- **FR-015**: As combinações de texto/superfície, ação primária, indicador de foco, erro, aviso, sucesso, informação e estado desabilitado aplicáveis DEVEM atender WCAG 2.2 nível AA. Cada estado deve comunicar significado por texto, ícone, forma ou outra pista além de cor.
- **FR-016**: A reforma DEVE preservar `frontend/` como interface oficial, a raiz como backend, e todas as rotas, contratos HTTP, autenticação, autorização, dados exibidos por papel e regras de negócio homologadas na feature 003.
- **FR-017**: A reforma NÃO DEVE exigir alteração de banco, Prisma, autenticação, autorização, contratos HTTP ou regras de persistência.

### Non-Functional Requirements

- **NFR-001**: Em 375 px, 1024 px e 1440 px, nenhuma rota da população principal definida em “População de homologação” deve apresentar rolagem horizontal involuntária.
- **NFR-002**: Em 200% de zoom, cada rota da população principal deve manter conteúdo, foco e ações essenciais disponíveis sem perda de informação.
- **NFR-003**: A validação de qualidade deve cobrir navegação por teclado, foco, contraste, loading, vazio, erro, sucesso, disabled, selected e ações destrutivas.
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
- **SC-002**: 0 páginas principais apresentam rolagem horizontal involuntária nos três tamanhos de viewport e em 200% de zoom.
- **SC-003**: 100% dos controles interativos modificados e dos controles acionáveis enumerados na matriz de homologação exibem foco visível e contínuo por teclado nos estados aplicáveis.
- **SC-004**: 100% das ações destrutivas afetadas exigem confirmação contextual; em teste de cancelamento, 0 mutações são realizadas.
- **SC-005**: 100% dos carregamentos públicos da vitrine preservam a estrutura final da grade durante a espera.
- **SC-006**: 100% dos estados vazio e erro listados na matriz de homologação informam contexto e apresentam recuperação ou próxima ação quando ela é autorizada.
- **SC-007**: 100% das combinações semânticas enumeradas em FR-015 e dos estados críticos listados na matriz de homologação comunicam significado por meio adicional à cor e aprovam contraste WCAG 2.2 AA.
- **SC-008**: A regressão dos fluxos homologados da feature 003 passa sem mudança de contrato, permissão, regra de negócio, banco ou autenticação.

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

## População de homologação

As rotas principais desta feature são: `/`, `/vitrine`, `/animais/$animalId`, `/login`, `/cadastro`, `/meu-perfil`, `/triagem`, `/meus-favoritos`, `/minhas-solicitacoes`, `/mensagens`, `/dashboard`, `/dashboard/animais`, `/dashboard/solicitacoes`, `/dashboard/saude`, `/dashboard/documentos`, `/dashboard/mensagens` e `/dashboard/admin/usuarios`. A matriz em `quickstart.md` define o perfil, os controles, os estados e a evidência de cada uma. Visitante, adotante, organização, acolhedor independente e administrador são populações separadas de validação, mesmo quando organização e acolhedor usam a mesma rota ou componente.

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
- Criação de plano, tarefas, Issues, Pull Request ou implementação nesta etapa de especificação.
