# Feature Specification: Perfis públicos e busca por nome

**Feature Branch**: `006-perfis-publicos`
**Created**: 2026-08-08
**Status**: Pronta para planejamento
**Input**: Pedido do mantenedor: "quando alguém pesquisa pelo nome da ONG na plataforma, ou clica no
nome pelo anúncio, o perfil deve abrir — com ícone, descrição, localização e o catálogo de todos os
animais em adoção, com filtros. E o perfil do adotante deve transmitir a triagem com transparência."

---

## Clarifications

### Session 2026-08-08

- Q: Quem enxerga a triagem do adotante? → A: **O próprio adotante, a administração e o responsável
  que tenha ou tenha tido qualquer solicitação daquele adotante.** O perfil público mostra nome,
  cidade e um selo de triagem concluída.
- Q: Endereço exato no perfil público, de quem? → A: **Somente de organização.** Acolhedor e
  adotante expõem apenas o município.
- Q: E o endereço do adotante na análise? → A: **Exibido ao próprio adotante, à administração e ao
  responsável que tenha ou tenha tido qualquer solicitação dele.** Quem vai entregar um animal
  precisa saber onde ele vai morar. Público restrito, propósito declarado, e fora do perfil público.

### Session 2026-08-10

- Q: Como o acolhedor independente deve ser identificado publicamente? → A: **Primeiro nome mais a
  inicial do último sobrenome**, por exemplo, “Marina S.”.
- Q: Quais limites a busca pública deve aplicar? → A: **Mínimo de 2 caracteres e máximo de 10
  resultados** por consulta.
- Q: Qual deve ser o limite da descrição de organização e acolhedor? → A: **Máximo de 500
  caracteres**.

**Por que a transparência da triagem foi delimitada.** A triagem contém `numAdultosCasa`,
`temCriancas`, `criancasFaixaEtaria`, `horasSozinho`, `janelasTeladas`, `murosSeguros`,
`moradiaPropria`, `alergicosNaCasa` e `planoEmGravidez`. Publicada junto de endereço e pesquisável
por nome, ela informa a qualquer pessoa onde alguém mora, quantas pessoas vivem ali, se há crianças
e de que idade, quantas horas a casa fica vazia e quão seguros são muros e janelas. Isso descreve a
vulnerabilidade de uma residência com menores, não a idoneidade de um adotante.

O objetivo real — **a organização precisa confiar em quem vai adotar** — é atendido entregando a
triagem completa a quem decide, no momento em que decide. Quem não recebeu solicitação daquela
pessoa não tem o que decidir e, portanto, não tem o que ver.

**Por que o endereço do acolhedor não é público.** Organização é pessoa jurídica com abrigo físico:
endereço público é útil e esperado, inclusive para visitas. Acolhedor é pessoa física e o endereço
dele é a casa dele. O encontro para conhecer o animal acontece pelo chat que já existe após a
aprovação, sem transformar a residência de um voluntário em ponto no mapa.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conhecer uma organização e seus animais (Priority: P1)

Como pessoa interessada em adotar, quero abrir o perfil de uma organização e ver quem ela é, onde
fica e todos os animais que ela tem para adoção, para decidir se quero procurá-la.

**Why this priority**: é o pedido central. Sem ela, o nome do responsável no anúncio é um beco sem
saída — a pessoa vê quem cuida do animal e não tem para onde ir.

**Independent Test**: abrir o perfil de uma organização com animais disponíveis, sem sessão, e
percorrer identificação, endereço e catálogo completo.

**Acceptance Scenarios**:

1. **Given** uma organização com animais disponíveis, **When** alguém abre seu perfil, **Then** vê
   nome, imagem de perfil quando houver, descrição, município/UF e endereço, e o catálogo dos
   animais disponíveis daquela organização.
2. **Given** o perfil aberto, **When** a pessoa aciona um animal do catálogo, **Then** chega à
   página pública daquele animal.
3. **Given** uma organização sem nenhum animal disponível, **When** o perfil é aberto, **Then** a
   ausência é explicada, sem sugerir que o perfil está quebrado.
4. **Given** uma organização com conta desativada, **When** alguém tenta abrir seu perfil, **Then**
   o perfil não é exibido e a resposta não revela se a conta existe.

---

### User Story 2 - Chegar ao perfil a partir do anúncio (Priority: P1)

Como pessoa vendo um animal, quero clicar em quem o cadastrou e ir direto ao perfil dessa
organização, para ver o que mais ela tem.

**Why this priority**: é o caminho natural e o mais percorrido; a busca é o caminho alternativo.

**Independent Test**: a partir do cartão do Feels e da página pública do animal, alcançar o perfil
do responsável em um acionamento.

**Acceptance Scenarios**:

1. **Given** um animal de organização no Feels ou na sua página pública, **When** a pessoa aciona o
   nome do responsável, **Then** chega ao perfil daquela organização.
2. **Given** um animal de acolhedor independente, **When** a pessoa aciona o responsável, **Then**
   chega a um perfil que identifica o acolhedor sem endereço e sem nome completo.

---

### User Story 3 - Encontrar organizações pelo nome (Priority: P2)

Como pessoa que ouviu falar de uma organização, quero pesquisar o nome dela na plataforma e chegar
ao seu perfil, para ver seus animais sem depender de topar com um anúncio.

**Why this priority**: amplia o alcance, mas o produto funciona sem ela enquanto os perfis forem
alcançáveis pelos anúncios.

**Independent Test**: pesquisar por trecho do nome de uma organização e alcançar seu perfil; repetir
com acentuação e caixa diferentes.

**Acceptance Scenarios**:

1. **Given** uma organização cadastrada, **When** alguém pesquisa parte do seu nome, **Then** ela
   aparece nos resultados com nome e município, e o resultado leva ao perfil.
2. **Given** uma busca escrita sem acento ou em caixa diferente, **When** os resultados são
   calculados, **Then** encontram a mesma organização.
3. **Given** uma busca sem correspondência, **When** termina, **Then** a pessoa entende que não há
   resultado e recebe um caminho para a vitrine.
4. **Given** qualquer pessoa não autenticada, **When** ela pesquisa, **Then** encontra apenas
   organizações — nunca adotantes nem acolhedores.

---

### User Story 4 - Manter o próprio perfil (Priority: P1)

Como organização, quero escrever minha descrição e enviar minha imagem de perfil, para que quem me
encontrar entenda meu trabalho.

**Why this priority**: sem isto o perfil da US1 nasce vazio para todo mundo.

**Independent Test**: editar descrição e imagem no painel, sair e reabrir o perfil público.

**Acceptance Scenarios**:

1. **Given** uma organização autenticada, **When** edita descrição e imagem de perfil, **Then** as
   alterações aparecem no seu perfil público.
2. **Given** uma organização sem descrição ou sem imagem, **When** seu perfil é aberto, **Then** ele
   permanece legível e íntegro, sem espaços quebrados.
3. **Given** qualquer conta, **When** tenta editar o perfil de outra, **Then** a operação é recusada.

---

### User Story 5 - Avaliar um adotante com a triagem (Priority: P1)

Como responsável que recebeu uma solicitação, quero ver a triagem completa de quem solicitou, para
decidir com informação em vez de intuição.

**Why this priority**: é o que o pedido de "transparência" realmente resolve, entregue a quem
decide.

**Independent Test**: com solicitação existente, abrir o perfil do adotante e ver a triagem; repetir
com um responsável sem solicitação daquele adotante e confirmar que ele não vê.

**Acceptance Scenarios**:

1. **Given** um responsável com solicitação de adoção de um adotante, **When** abre o perfil dele,
   **Then** vê a triagem completa **e o endereço do adotante**, identificados como informação de
   análise daquela solicitação.
2. **Given** um responsável sem nenhuma solicitação daquele adotante, **When** abre o perfil dele,
   **Then** vê apenas nome, município e o selo de triagem concluída — e a triagem não é entregue
   pela API, não apenas ocultada na tela.
3. **Given** uma pessoa não autenticada ou outro adotante, **When** tenta abrir o perfil de um
   adotante, **Then** não obtém a triagem em nenhuma circunstância.
4. **Given** o próprio adotante, **When** abre seu perfil, **Then** vê a própria triagem e entende
   quem mais pode vê-la.

---

### US6 - Perfil de acolhedor independente (Priority: P3)

Como pessoa vendo um animal acolhido, quero saber quem o acolhe e o que mais essa pessoa tem para
adoção, sem que isso exponha a casa dela.

**Why this priority**: completa o mapa de perfis, mas envolve o dado mais sensível; entra por
último, quando as regras já estiverem exercitadas.

**Independent Test**: abrir o perfil de um acolhedor e confirmar identificação, município, catálogo
e ausência total de endereço, CPF e nome completo.

**Acceptance Scenarios**:

1. **Given** um acolhedor com animais disponíveis, **When** seu perfil é aberto, **Then** mostra o
   primeiro nome e a inicial do último sobrenome, o município e o catálogo, sem endereço, CPF ou
   nome completo.
2. **Given** qualquer resposta desse perfil, **When** inspecionada, **Then** não contém endereço,
   CPF, telefone, e-mail nem coordenada.

### Edge Cases

- Organização que apaga a descrição volta ao estado sem descrição, sem deixar o perfil quebrado.
- Nome de organização com acento, caixa alta ou espaço duplicado deve ser encontrado pela busca.
- Busca com um caractere só, ou só com espaços, não deve varrer a base.
- Animal que muda de status enquanto o catálogo está aberto não deve aparecer como disponível ao
  recarregar.
- Conta desativada entre a busca e a abertura do perfil deve levar ao mesmo tratamento de perfil
  inexistente.
- Adotante sem triagem concluída não deve exibir selo que sugira o contrário.
- Solicitação recusada ou concluída ainda dá à organização o direito de ver a triagem daquela
  análise; o vínculo é o histórico, não o status atual.

---

## Requirements *(mandatory)*

### A. Identidade e perfil

- **FR-001**: Cada organização e cada acolhedor independente DEVE ter perfil público endereçável por
  URL estável, alcançável sem sessão.
- **FR-002**: O perfil de organização DEVE exibir nome, município/UF, endereço, descrição e imagem
  de perfil quando houver, além do catálogo de animais disponíveis daquela conta.
- **FR-003**: O perfil de acolhedor independente NÃO DEVE exibir endereço, CPF, nome completo,
  telefone nem e-mail. DEVE identificá-lo pelo primeiro nome e pela inicial do último sobrenome,
  além de exibir o município e o catálogo.
- **FR-004**: O perfil de adotante DEVE exibir nome, município e se a triagem foi concluída. NÃO
  DEVE exibir endereço, CPF, telefone nem e-mail.
- **FR-005**: Perfil de conta desativada NÃO DEVE ser exibido, e a resposta NÃO DEVE permitir
  distinguir conta inexistente de conta desativada.
- **FR-006**: Organização e acolhedor DEVEM poder manter descrição própria, limitada a 500
  caracteres, e imagem de perfil própria. Nenhuma conta DEVE conseguir alterar o perfil de outra.
- **FR-007**: Perfil sem descrição ou sem imagem DEVE permanecer íntegro e legível.

### B. Catálogo dentro do perfil

- **FR-008**: O catálogo DEVE listar apenas animais com status disponível pertencentes àquele
  responsável, e cada item DEVE levar à página pública do animal.
- **FR-009**: O catálogo DEVE oferecer filtros de sexo, porte e espécie. DEVE oferecer também filtro
  por raça, exibindo-o apenas quando houver raça registrada entre aqueles animais — o campo é
  opcional no schema e hoje está vazio em toda a base.
- **FR-010**: Filtros ativos DEVEM ser identificáveis e reversíveis, e o resultado vazio DEVE
  explicar a causa e oferecer a limpeza dos filtros.
- **FR-011**: O catálogo DEVE suportar organização com muitos animais sem carregar tudo de uma vez.

### C. Busca

- **FR-012**: A plataforma DEVE permitir buscar organizações por trecho do nome, ignorando
  acentuação, caixa e espaços repetidos.
- **FR-013**: A busca pública DEVE retornar somente organizações. Adotantes e acolhedores NÃO DEVEM
  ser pesquisáveis publicamente.
- **FR-014**: A busca DEVE exigir no mínimo 2 caracteres, retornar no máximo 10 resultados por
  consulta e jamais retornar endereço, documento ou contato.
- **FR-015**: Resultado vazio DEVE ser explicado, com caminho para a vitrine.

### D. Triagem: quem vê

- **FR-016**: A triagem completa de um adotante DEVE ser entregue somente a: o próprio adotante, um
  responsável que tenha ou tenha tido solicitação de adoção daquele adotante, e a administração.
- **FR-016a**: Para esse público restrito, a triagem DEVE incluir o **endereço completo do
  adotante**. Quem vai entregar um animal precisa saber onde ele vai morar — para visita, para
  avaliar a distância e para conferir o que foi declarado. Este é o único lugar do produto onde o
  endereço de uma pessoa física é exibido, e ele DEVE aparecer identificado como dado de análise,
  nunca no perfil público de FR-004.
- **FR-017**: Para quem não se enquadra em FR-016, a triagem NÃO DEVE ser incluída na resposta da
  API — não basta ocultá-la na interface.
- **FR-018**: O vínculo que autoriza é a existência da solicitação, independentemente do seu status
  atual: análise, aprovada, recusada ou concluída.
- **FR-019**: A tela que exibe a triagem ao adotante DEVE informar quem mais pode vê-la.

### E. Privacidade e escopo de dado

- **FR-020**: Nenhuma nova resposta pública desta feature, nem o novo endpoint de perfil do
  adotante em qualquer projeção, DEVE conter coordenada geográfica, CPF, CNPJ, e-mail, telefone ou
  senha. Esta restrição não altera o contrato privado preexistente de manutenção do próprio perfil.
  Endereço aparece em exatamente dois lugares: no perfil público de organização, e no pacote de
  análise de FR-016a, entregue apenas a quem tem vínculo de solicitação.
- **FR-021**: Os dados exibidos DEVEM vir do que já é coletado no cadastro. A triagem NÃO DEVE
  passar a coletar endereço: ele já existe desde a feature 005, resolvido por CEP.
- **FR-022**: Imagem de perfil DEVE seguir o fluxo de upload já homologado, com os mesmos limites de
  tipo e tamanho das fotos de animal.

### Non-Functional Requirements

- **NFR-001**: Perfil e catálogo DEVEM funcionar em 375 px, 1024 px e 1440 px sem rolagem horizontal
  da página, e a 200% de zoom sem perda de informação.
- **NFR-002**: A busca NÃO DEVE degradar com o crescimento da base: filtragem e limite acontecem no
  banco, nunca em memória sobre a tabela inteira.
- **NFR-003**: A homologação DEVE usar apenas contas e dados de teste já autorizados.

### Constitution Requirements *(mandatory)*

- **CR-001**: Novos campos de perfil entram por `prisma/schema.prisma` e migration, nunca por
  alteração direta no banco.
- **CR-002**: Sem SQL cru. Busca e filtros expressos em consulta Prisma.
- **CR-003**: A autorização de FR-016 é decidida no servidor, a partir da sessão e do vínculo real
  de solicitação. O navegador não informa quem ele é.
- **CR-004**: DTOs estreitos: cada perfil devolve apenas os campos que aquele público pode ver, em
  vez de um objeto amplo filtrado na tela.
- **CR-005**: Validação Zod na fronteira, para termo de busca, filtros e conteúdo de perfil.
- **CR-006**: TypeScript strict, sem `any` explícito.
- **CR-007**: Toda regra de FR-016, FR-013 e FR-020 recebe teste Vitest que falha se a proteção for
  removida.

### Key Entities

- **Perfil público**: projeção de leitura de uma conta, recortada pelo papel e pelo público. Não é
  entidade nova; é uma visão sobre organização, acolhedor e adotante.
- **Descrição e imagem de perfil**: campos novos de organização e acolhedor.
- **Vínculo de análise**: a solicitação de adoção existente entre adotante e responsável, que é o
  que autoriza a leitura da triagem.

---

## Impacto em dados

| Mudança | Entidade | Observação |
|---|---|---|
| `descricao` | Organizacao, AcolhedorIndependente | Texto livre opcional, com máximo de 500 caracteres |
| Imagem de perfil | Organizacao, AcolhedorIndependente | Reverte a decisão anterior de não ter `fotoUrl` no schema; hoje o campo existe só no tipo do frontend |
| Nenhuma mudança | Adotante | Já tem nome, município e `triagemConcluida` |

---

## Success Criteria *(mandatory)*

- **SC-001**: 100% dos perfis de organização com animais disponíveis exibem o catálogo completo
  daquela conta.
- **SC-002**: 0 novas respostas públicas desta feature e 0 respostas do novo endpoint de perfil do
  adotante contêm CPF, CNPJ, telefone, e-mail ou coordenada; o contrato privado preexistente de
  manutenção do próprio perfil permanece fora deste critério.
- **SC-003**: 0 respostas de **perfil público** de acolhedor ou de adotante contêm endereço.
- **SC-004**: 100% das tentativas de ler a triagem ou o endereço do adotante sem o vínculo de FR-016
  são recusadas na API.
- **SC-004a**: 100% dos responsáveis com solicitação recebem endereço e triagem do solicitante.
- **SC-005**: 100% das buscas por nome com acento ou caixa diferente encontram a mesma organização.
- **SC-006**: 0 adotantes e 0 acolhedores aparecem em resultado de busca pública.
- **SC-007**: 0 rotas da feature apresentam rolagem horizontal nas três larguras-alvo ou a 200%.
- **SC-008**: Os fluxos homologados nas features 003, 004 e 005 seguem passando.

---

## Dependencies

- Municípios e localização por CEP, entregues na feature 005: o município exibido nos perfis vem de
  lá.
- Página pública do animal e vitrine, da feature 003, como destino do catálogo.
- Uploadthing, já homologado, para a imagem de perfil.
- Solicitações de adoção, da feature 001, como fonte do vínculo que autoriza a triagem.

## Assumptions

- Organizações querem ser encontradas: nome, endereço e descrição são informação institucional.
- Acolhedores querem ajudar animais, não publicar onde moram; a plataforma perde voluntários se
  confundir as duas coisas.
- A confiança que a organização precisa vem de ver a triagem de quem solicitou, não de a triagem ser
  pública.
- A raça continuará pouco preenchida; o filtro por raça precisa desaparecer graciosamente quando não
  houver dado.

## Out of Scope

- Busca por adotante ou acolhedor, e qualquer diretório de pessoas físicas.
- Triagem pública, em qualquer recorte.
- Endereço de pessoa física em resposta pública.
- Mapa, geolocalização de perfil ou rota até o endereço.
- Seguir perfis, avaliar organizações, comentar, mensagem direta fora do chat de adoção existente.
- Perfil de administração.
