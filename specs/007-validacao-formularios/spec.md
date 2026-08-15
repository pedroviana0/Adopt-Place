# Feature Specification: Validação integral de formulários

**Feature Branch**: `007-validacao-formularios`

**Created**: 2026-08-14

**Status**: Entregue parcialmente em 2026-08-14 (implementação concluída; homologação manual exaustiva pendente)

**Input**: Auditar e fortalecer todos os formulários do AdoptPlace, alinhar validações no cliente e no servidor, padronizar erros em português e fazer o filtro de raça refletir somente animais disponíveis.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preencher formulários com segurança e orientação (Priority: P1)

Como pessoa usuária, quero receber validação imediata, clara e acessível em todos os campos para corrigir entradas antes do envio sem perder o que já preenchi.

**Why this priority**: Cadastro, triagem e operações dos perfis dependem de dados válidos; mensagens tardias ou genéricas impedem a conclusão das jornadas centrais.

**Independent Test**: Percorrer cada entrada editável com valores válidos, vazios, limítrofes e inválidos e confirmar mensagens específicas em português, foco no primeiro erro e preservação dos valores.

**Acceptance Scenarios**:

1. **Given** um campo já tocado com valor inválido, **When** a pessoa sai do campo ou tenta enviar, **Then** o campo recebe estado destrutivo e uma mensagem específica associada de forma acessível.
2. **Given** um formulário com campos inválidos, **When** a pessoa tenta enviar, **Then** nenhum envio ocorre, o primeiro campo inválido recebe foco e os demais valores permanecem preenchidos.
3. **Given** uma requisição em andamento, **When** a pessoa tenta enviar novamente, **Then** o envio duplicado é impedido e o estado de carregamento permanece claro.

---

### User Story 2 - Impedir dados inválidos pela API (Priority: P1)

Como responsável pelo sistema, quero que toda entrada seja validada autoritativamente antes de persistência ou efeito colateral para que chamadas diretas não contornem as regras da interface.

**Why this priority**: Validação apenas visual não protege dados, autorização nem contratos públicos.

**Independent Test**: Chamar cada endpoint mutável com campos vazios, espaços, limites excedidos, tipos adulterados, propriedades extras, identificadores inválidos e dependências condicionais incompletas.

**Acceptance Scenarios**:

1. **Given** um payload inválido, **When** ele chega ao servidor, **Then** a operação não produz efeito e responde com erro de validação estruturado por campo sem detalhes internos.
2. **Given** um payload com propriedades não permitidas ou alteração de papel, **When** ele chega ao servidor, **Then** as propriedades são rejeitadas e autorização e sessão continuam sendo derivadas no servidor.
3. **Given** uma violação de unicidade que pode ser comunicada com segurança, **When** o cadastro é tentado, **Then** o erro é associado ao campo correspondente.

---

### User Story 3 - Filtrar por raças realmente disponíveis (Priority: P1)

Como visitante da vitrine ou de um perfil público, quero ver apenas raças que tenham ao menos um animal disponível no catálogo atual para que toda opção possa produzir resultados úteis.

**Why this priority**: Opções sem resultados criam uma promessa falsa e confundem a busca por animais.

**Independent Test**: Alternar espécie e contexto de catálogo e mudar animais entre disponível e indisponível, verificando a presença, ausência, ordenação e limpeza da raça selecionada.

**Acceptance Scenarios**:

1. **Given** uma espécie selecionada, **When** as opções de raça são carregadas, **Then** aparecem em ordem alfabética apenas raças com pelo menos um animal disponível naquele catálogo.
2. **Given** uma raça selecionada, **When** a espécie muda ou é limpa e a raça deixa de ser compatível, **Then** a seleção de raça também é limpa.
3. **Given** que nenhum animal disponível da espécie possui raça, **When** o filtro é exibido, **Then** o seletor fica desabilitado ou comunica claramente que não há raças disponíveis.

---

### User Story 4 - Informar limites antes do erro (Priority: P2)

Como pessoa usuária, quero enxergar limites de textos e números enquanto preencho para não descobrir restrições somente no envio.

**Why this priority**: Limites visíveis reduzem retrabalho e tornam as regras previsíveis.

**Independent Test**: Conferir controles curtos, textareas, quantidades, datas e uploads e comparar os limites visuais com os limites autoritativos.

**Acceptance Scenarios**:

1. **Given** um campo textual longo, **When** a pessoa digita, **Then** um contador ou aviso discreto informa o limite exato aceito.
2. **Given** um campo numérico, **When** valores negativos, fracionários indevidos, não finitos ou fora do intervalo são informados, **Then** o formulário e o servidor os rejeitam com a mesma regra.

### Edge Cases

- Valores ausentes, `null`, string vazia e string composta apenas por espaços são tratados conscientemente por campo.
- Nomes brasileiros com acentos, hífen e apóstrofo são aceitos, enquanto números, símbolos isolados e conteúdo sem aparência de nome são rejeitados.
- CPF e CNPJ com ou sem máscara são normalizados, têm dígitos verificadores validados e rejeitam sequências repetidas.
- Telefones, CEPs, e-mails, Instagram, datas, IDs, enums, buscas e textos enormes respeitam formato e limites.
- Perguntas booleanas distinguem “não” de “não respondido”; detalhes condicionais e consentimentos obrigatórios são exigidos conforme a resposta.
- Uploads inválidos por quantidade, tipo, extensão aparente, tamanho ou autorização não causam persistência.
- Falhas inesperadas não são apresentadas como falsos erros de validação nem revelam dados pessoais, banco ou stack trace.
- Catálogos públicos distintos não compartilham opções de raça fora de seu próprio universo disponível.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST manter um inventário verificável de todas as entradas do frontend oficial e seus contratos autoritativos correspondentes.
- **FR-002**: Toda entrada fornecida pelo usuário MUST possuir validação no cliente e no servidor antes de persistência ou efeito colateral.
- **FR-003**: Campos textuais MUST aparar espaços exteriores, rejeitar conteúdo sem significado quando obrigatório e possuir limite máximo idêntico nas duas camadas.
- **FR-004**: Campos numéricos MUST rejeitar valores não finitos, negativos indevidos, frações indevidas e valores fora de intervalos plausíveis.
- **FR-005**: Identificadores, enums e seletores MUST aceitar somente formatos e valores realmente suportados pelo domínio.
- **FR-006**: Nomes de pessoa, razão social, CPF, CNPJ, telefone, CEP, e-mail, senha, endereço e Instagram MUST seguir as regras brasileiras e de compatibilidade descritas nos cenários e casos-limite.
- **FR-007**: Datas MUST ser possíveis, respeitar intervalos explícitos e rejeitar relações cronológicas incoerentes.
- **FR-008**: Campos condicionais da triagem MUST exigir detalhes dependentes e consentimentos conforme as respostas, distinguindo resposta negativa de ausência de resposta.
- **FR-009**: A fronteira da triagem MUST preservar compatibilidade com nomes persistidos ou legados divergentes sem quebrar contratos silenciosamente.
- **FR-010**: Uploads MUST ser validados por quantidade, tipo declarado, extensão aparente, tamanho e autorização antes da persistência.
- **FR-011**: Payloads mutáveis MUST rejeitar propriedades extras quando aplicável e nunca aceitar papel, dono ou autorização fornecidos pelo cliente.
- **FR-012**: Erros de validação MUST usar o contrato existente consolidado, com mensagem geral segura e erros associáveis a campos.
- **FR-013**: Mensagens de validação e falhas previsíveis MUST ser específicas e em português, sem mensagens padrão em inglês.
- **FR-014**: O frontend MUST associar erro ao controle, marcar o estado inválido, focar o primeiro erro após tentativa de envio e preservar valores preenchidos.
- **FR-015**: Formulários MUST bloquear o botão durante a requisição e impedir envios duplicados.
- **FR-016**: Campos textuais longos MUST exibir contador; campos curtos MUST exibir contador ou indicação discreta do limite quando isso melhorar a compreensão.
- **FR-017**: Campos numéricos MUST expor limites e incremento coerentes sem depender desses atributos para segurança.
- **FR-018**: O erro de “Tipo de animal desejado” MUST ser substituído por uma regra coerente e mensagem em português.
- **FR-019**: As opções de raça MUST ser obtidas da fonte autoritativa e incluir apenas raças com ao menos um animal `DISPONÍVEL` no universo do catálogo corrente.
- **FR-020**: As raças MUST permanecer dependentes da espécie, ordenadas alfabeticamente e limpar seleções incompatíveis ao trocar ou remover a espécie.
- **FR-021**: O carregamento de raças MUST evitar consulta por item, exposição de animais indisponíveis e carregamento desnecessário da tabela inteira.
- **FR-022**: O filtro de raça MUST preservar carregamento, erro, limpeza, paginação e acessibilidade e comunicar claramente quando não houver opções.
- **FR-023**: Respostas públicas MUST continuar excluindo CPF, CNPJ, telefone, e-mail, triagem e demais dados pessoais não autorizados.
- **FR-024**: A entrega MUST incluir testes automatizados dos limites, documentos brasileiros, telefone, enums adulterados, campos extras, condicionais, erros estruturados e raças disponíveis.
- **FR-025**: A homologação MUST cobrir todos os perfis em 375, 1024 e 1440 px, zoom de 200%, teclado, atributos acessíveis, temas, rede lenta, repetição de envio e falhas do servidor.

### Constitution Requirements *(mandatory)*

- **CR-001**: Requirements MUST NOT introduce abstractions that are not required by current functional requirements.
- **CR-002**: Data requirements MUST identify the Prisma schema entities, fields, relationships, or constraints that represent the source of truth.
- **CR-003**: Business rules MUST be described as server-side behavior unless a client-only interaction is explicitly required for UX.
- **CR-004**: Protected data access MUST identify the authenticated user/session requirement and sensitive fields that must not be exposed publicly.
- **CR-005**: User input MUST identify both client-facing validation needs and server-side validation/security requirements.
- **CR-006**: Client state requirements MUST be limited to transient UI state unless the feature provides a documented reason for a richer client state flow.
- **CR-007**: New dependency requirements MUST state why the existing stack cannot satisfy the capability.
- **CR-008**: Entity typing requirements MUST use generated domain types or narrow derivatives and MUST NOT require explicit `any`.

### Key Entities

- **Entrada editável**: campo, controle, parâmetro de busca ou arquivo fornecido pela pessoa usuária, com obrigatoriedade, normalização, formato, limites e dependências explícitas.
- **Contrato de formulário**: correspondência entre controles do frontend, validação autoritativa, endpoint, operação e campos persistidos.
- **Erro de campo**: mensagem segura e localizada associada a um caminho de entrada específico.
- **Opção de raça**: combinação de espécie, raça e escopo de catálogo sustentada por ao menos um animal disponível.
- **Triagem**: respostas do adotante com perguntas obrigatórias, booleanos triestados e detalhes condicionais.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das entradas inventariadas possuem obrigatoriedade, normalização, formato e limites documentados e testados nas duas camadas quando produzem requisição.
- **SC-002**: 100% das mensagens previsíveis exibidas ao usuário estão em português e associadas ao campo correto quando houver um campo responsável.
- **SC-003**: Nenhuma chamada direta com payload inválido nos casos obrigatórios produz persistência ou efeito colateral.
- **SC-004**: Em todos os catálogos públicos, 100% das raças exibidas possuem ao menos um animal disponível no escopo atual e nenhuma raça elegível fica ausente após atualização.
- **SC-005**: Todos os fluxos críticos podem ser concluídos por teclado em 375, 1024 e 1440 px e com zoom de 200%, sem perda de dados após erro recuperável.
- **SC-006**: Todos os portões automatizados do projeto passam, incluindo testes, validação do modelo, verificação de tipos e build do frontend.

## Assumptions

- Os contratos e enums existentes no código e no banco são a fonte de verdade e serão preservados quando divergirem de textos históricos.
- A tarefa será resolvida sem nova dependência e, salvo evidência incontornável, sem alteração de schema ou migration.
- O contrato de erro existente será consolidado em vez de substituído por um segundo formato concorrente.
- Campos opcionais vazios serão normalizados para a representação já adotada por cada contrato (`undefined` ou `null`) sem alterar dados persistidos silenciosamente.
- A configuração funcional de produção não será deduzida do placeholder versionado; nenhuma mudança de deploy ocorrerá sem autorização.
