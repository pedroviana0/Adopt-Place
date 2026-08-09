# Feature Specification: Feels — descoberta por swipe com proximidade real

**Feature Branch**: `005-feels`
**Created**: 2026-08-07
**Status**: Aprovada pelo mantenedor em 2026-08-08. Nome do produto definido: **Feels**.
**Input**: Ideação de descoberta por swipe registrada no handoff do `CLAUDE.md` (seção 10) + decisões
da sessão de 2026-08-07 registradas abaixo.

> **Nome.** A funcionalidade chama-se **Feels** na interface e na comunicação com quem usa. Nos
> requisitos abaixo, "o feed" e "a pilha" designam a tela do Feels. A rota é `/feels`.

> **Nota de leitura.** Esta feature entrega duas camadas de uma vez: a **camada de localização**
> (CEP → coordenada → distância) e o **feed de swipe** que a consome. A separação em duas specs foi
> avaliada e recusada pelo mantenedor: a camada de localização sozinha não entrega nada demonstrável
> para a banca, e o swipe sem coordenada abandona o "a X km de você", que é o coração da ideia.

---

## Clarifications

### Session 2026-08-07

- Q: Quem pode usar o feed de swipe? → A: Somente adotante autenticado e ativo. Visitante é
  direcionado a login/cadastro; a rota é protegida.
- Q: Qual a escala do produto? → A: **Uso nacional**, com projeção de volume alto. A solução de
  localização não pode assumir a região de Volta Redonda.
- Q: Como obter coordenada sem API paga, em escala nacional? → A: Geocoding **por API**, atrás de
  uma interface abstrata, com implementação inicial em BrasilAPI/ViaCEP (gratuita, sem chave).
- Q: Quando o geocoding é executado? → A: **Na escrita** (cadastro/edição de endereço), com a
  coordenada persistida. Nunca no caminho de leitura do feed.

### Session 2026-08-08 — revisão após medição das APIs

A decisão de usar API como fonte de coordenada foi **revertida por evidência**. Medições feitas
contra as APIs reais:

- Quatro CEPs de São Paulo em zonas opostas (Bela Vista, Santana, Capão Redondo, Itaquera)
  retornam a **coordenada idêntica** `-23.5475, -46.63611`. O mesmo em Volta Redonda, entre
  bairros distintos. O campo `location` da BrasilAPI é a coordenada do **município**, não do
  endereço — não há geocoding de endereço acontecendo.
- O centroide de município diverge da coordenada devolvida pela API em **0,5 a 1,9 km**, medido em
  cinco cidades de portes diferentes. Irrelevante diante de raios de 25 km ou mais.
- BrasilAPI responde **404** para CEP inexistente; ViaCEP responde **HTTP 200** com
  `{"erro":"true"}`. Semânticas opostas para o mesmo caso.
- Nominatim (OSM) entrega precisão real de rua, mas tem política de uso restritiva.

- Q: Qual passa a ser a fonte da coordenada? → A: A **tabela de municípios**, sempre. Offline, sem
  terceiro no caminho. A API de CEP deixa de ser fonte de coordenada.
- Q: Para que serve então a API de CEP? → A: Validar que o CEP existe, preencher
  logradouro/bairro/cidade/UF e devolver o **código IBGE**, que é a chave de junção com a tabela.
- Q: E se a API de CEP cair? → A: A pessoa escolhe o município numa lista vinda da nossa própria
  tabela e o cadastro conclui **sem nenhuma perda de coordenada**.
- Q: Precisão de rua? → A: **Fora desta feature.** Nominatim fica para spec futura, se a ordenação
  dentro de uma mesma cidade virar necessidade real.
- Q: Manter registro da origem da coordenada? → A: Sim, campo de precisão, hoje sempre
  `MUNICIPIO`. É o que permite refinar depois só o que precisa, sem varrer a base.
- Q: Como o endereço vira coordenada? → A: **CEP obrigatório** no cadastro de organização,
  acolhedor e adotante; o CEP preenche logradouro/cidade/UF e origina a coordenada.
- Q: E se a API de geocoding estiver fora do ar durante um cadastro? → A: Cai para o **centroide do
  município** (tabela seedada) e o cadastro conclui. Serviço de terceiro não bloqueia o produto.
- Q: Onde vive a base de municípios? → A: **Tabela no banco**, seedada a partir da base do IBGE.
- Q: A distância filtra ou ordena? → A: **Ordena sempre** (mais perto primeiro); o raio é um filtro
  **opcional** que a pessoa liga. Raio rígido por padrão esvaziaria a tela em escala nacional.
- Q: E animal sem localização válida? → A: **Não existe** — o cadastro não conclui sem localização
  válida. A hipótese de "animal sem coordenada" é eliminada na origem, não tratada no feed.
- Q: O que acontece com o animal pulado? → A: Rejeição **efêmera em `sessionStorage`**: não volta
  durante a sessão de navegação, reaparece em visitas futuras. Nada é persistido no banco.
- Q: Quais filtros o feed tem? → A: Somente **distância (raio) e espécie**. O refinamento fino
  continua sendo função da vitrine.
- Q: Curtir abre solicitação de adoção? → A: **Não.** Curtir grava em Favoritos. A solicitação
  continua sendo um ato deliberado, feito na página do animal.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar-se com localização confiável (Priority: P1)

Como organização, acolhedor independente ou adotante, quero informar meu CEP e ter meu endereço e
minha localização preenchidos automaticamente, para que os animais sob minha responsabilidade
apareçam para quem está perto — sem eu precisar entender de mapa ou coordenada.

**Why this priority**: é a fundação. Sem coordenada persistida não existe ordenação por proximidade,
e a feature inteira degrada para uma lista aleatória. É também a única parte que toca formulários já
homologados nas features 003/004, então precisa estabilizar antes do resto.

**Independent Test**: cadastrar uma organização, um acolhedor e um adotante informando CEPs de
estados diferentes; confirmar que cidade/UF vieram preenchidas, que a coordenada foi persistida e
que a precisão registrada é `CEP`. Repetir com a API de geocoding indisponível e confirmar que o
cadastro conclui com precisão `MUNICIPIO`.

**Acceptance Scenarios**:

1. **Given** alguém preenchendo o cadastro de organização, acolhedor ou adotante, **When** informar
   um CEP válido, **Then** logradouro, cidade e UF são preenchidos automaticamente, permanecem
   editáveis no que a pessoa precisar corrigir, e a coordenada correspondente é persistida sem
   nenhuma exibição de latitude/longitude na interface.
2. **Given** um CEP inexistente ou malformado, **When** a pessoa tentar avançar, **Then** o erro é
   associado ao campo CEP, explica o que fazer, e os demais valores já digitados são preservados.
3. **Given** o provedor de geocoding indisponível ou sem coordenada para aquele CEP, **When** o
   cadastro é submetido, **Then** ele conclui normalmente usando o centroide do município informado,
   registra a precisão como `MUNICIPIO`, e a pessoa não vê nenhuma mensagem de falha técnica.
4. **Given** uma organização ou acolhedor já cadastrado, **When** editar o endereço no perfil,
   **Then** a coordenada é recalculada na mesma submissão e passa a valer para os animais daquele
   responsável no feed.

---

### User Story 2 - Descobrir animais deslizando um por vez (Priority: P1)

Como adotante autenticado, quero ver um animal por vez em tela cheia e decidir com um gesto, para
conhecer animais disponíveis de um jeito leve, sem encarar uma grade de filtros.

**Why this priority**: é a feature pedida. Entrega valor sozinha assim que a US1 existir, e é o que
será demonstrado na banca.

**Independent Test**: com sessão de `adotante.aprovado@example.com`, abrir `/feels`, percorrer a
pilha inteira por gesto no toque, por arraste no mouse e por teclado, e confirmar que cada animal
aparece uma única vez até a pilha esgotar.

**Acceptance Scenarios**:

1. **Given** um adotante ativo em `/feels`, **When** a tela carrega, **Then** vê um único cartão com
   foto real ocupando a maior parte da área e, em hierarquia decrescente, nome com idade, a frase de
   espécie e porte, e por fim sexo, cidade/UF e distância — sem rolagem horizontal da página.
2. **Given** um cartão visível, **When** a pessoa arrasta para a direita, arrasta para a esquerda,
   usa os botões visíveis de curtir/pular ou pressiona as setas ←/→ do teclado, **Then** o cartão
   sai com a mesma consequência em qualquer um dos quatro caminhos e o próximo entra.
3. **Given** um arraste iniciado e não concluído, **When** a pessoa solta o cartão antes do limiar de
   decisão, **Then** ele retorna à posição original e nenhuma ação é registrada.
4. **Given** a pessoa com `prefers-reduced-motion` ativo, **When** interagir com a pilha, **Then** a
   transição entre cartões ocorre sem animação de deslize e o resultado de cada ação é idêntico.
5. **Given** a pilha esgotada para os critérios atuais, **When** o último cartão sai, **Then** a
   pessoa recebe um estado final que explica o motivo e oferece as ações aplicáveis: ampliar o raio,
   trocar a espécie, ver seus favoritos ou ir para a vitrine.
6. **Given** uma falha de rede ao buscar o próximo lote, **When** o erro ocorre, **Then** os cartões
   já carregados permanecem utilizáveis, o erro é comunicado como recuperável e há ação de tentar
   novamente.

---

### User Story 3 - Curtir para salvar nos favoritos (Priority: P1)

Como adotante, quero que curtir um animal o guarde nos meus favoritos, para revisitar com calma
depois — sem que isso comprometa nada nem avise ninguém.

**Why this priority**: é o que transforma o gesto em resultado. Sem isso o swipe é entretenimento.

**Independent Test**: curtir três animais no feed, abrir `/meus-favoritos` e confirmar os três;
confirmar em `/dashboard/solicitacoes` da organização responsável que nenhuma solicitação foi criada
e que nenhuma notificação foi disparada.

**Acceptance Scenarios**:

1. **Given** um cartão visível, **When** a pessoa curte, **Then** o animal passa a constar em
   `/meus-favoritos` e a confirmação aparece no próprio contexto, sem tirar a pessoa do feed.
2. **Given** um animal curtido, **When** a organização ou acolhedor responsável abre suas
   solicitações e suas notificações, **Then** não há nenhuma solicitação nova nem nenhum aviso — o
   curtir é privado do adotante.
3. **Given** a gravação do favorito falha, **When** o erro ocorre, **Then** a pessoa é avisada de que
   aquele animal não foi salvo, com ação de tentar novamente, e o animal não é perdido da sessão.
4. **Given** um animal que a pessoa já tinha favoritado antes por outro caminho, **When** o feed é
   montado, **Then** aquele animal não entra na pilha.
5. **Given** um animal para o qual a pessoa já tem solicitação de adoção registrada, **When** o feed
   é montado, **Then** aquele animal não entra na pilha.

---

### User Story 4 - Ver primeiro quem está perto (Priority: P2)

Como adotante, quero que os animais mais próximos apareçam primeiro e poder limitar por raio e
espécie, para não me apegar a um animal do outro lado do país.

**Why this priority**: é o diferencial sobre a vitrine, mas o feed já entrega valor antes disso; por
isso P2 e não P1.

**Independent Test**: com adotante em uma cidade conhecida, montar o feed e conferir que as
distâncias exibidas são não decrescentes; aplicar cada valor de raio e a troca de espécie e conferir
que a pilha reinicia coerente com o novo critério.

**Acceptance Scenarios**:

1. **Given** um adotante com localização determinada, **When** a pilha é montada, **Then** os animais
   vêm do mais próximo para o mais distante e cada cartão mostra a distância aproximada em km.
2. **Given** a pessoa acessando o feed pela primeira vez, **When** a permissão de localização do
   navegador é solicitada e concedida, **Then** a posição do navegador é usada; **When** é negada ou
   indisponível, **Then** o sistema usa a localização do próprio cadastro sem interromper o fluxo.
3. **Given** um adotante sem localização no cadastro e com permissão negada, **When** o feed carrega,
   **Then** a pessoa escolhe manualmente um município e o feed é montado a partir dele.
4. **Given** o raio ajustado para 25, 50, 100 ou 200 km, **When** o filtro é aplicado, **Then** todos
   os animais da pilha estão dentro do raio, e o estado vazio decorrente oferece ampliar o raio.
5. **Given** a espécie ajustada para cão, gato ou todos, **When** o filtro é aplicado, **Then** a
   pilha é remontada respeitando a escolha, preservando a ordenação por proximidade.
6. **Given** qualquer cartão exibido, **When** a pessoa inspeciona a resposta recebida pelo
   navegador, **Then** encontra apenas distância, cidade e UF — nunca a coordenada do responsável.

---

### User Story 5 - Conhecer o animal pelas fotos reais (Priority: P2)

Como adotante, quero passar pelas fotos reais do animal dentro do próprio cartão, para decidir com
mais do que uma imagem.

**Why this priority**: a decisão por gesto é visual; uma foto só reduz a qualidade da decisão. Mas o
feed funciona com a foto principal, então não bloqueia a US2.

**Independent Test**: abrir um animal com várias fotos e um com apenas uma; percorrer as fotos por
toque, por clique e por teclado em ambos.

**Acceptance Scenarios**:

1. **Given** um animal com mais de uma foto, **When** o cartão é exibido, **Then** há indicação de
   quantas fotos existem e qual está visível, e é possível avançar e voltar sem que isso dispare
   curtir ou pular.
2. **Given** um animal com uma única foto, **When** o cartão é exibido, **Then** os controles de
   navegação entre fotos não aparecem.
3. **Given** uma foto existente que falha ao carregar, **When** o erro ocorre, **Then** a falha é
   comunicada como falha de carregamento, distinta de ausência de foto, preservando nome e ações do
   cartão.

---

### User Story 6 - Desfazer o último cartão (Priority: P3)

Como adotante, quero desfazer a última decisão, para corrigir um gesto acidental sem procurar o
animal de novo.

**Why this priority**: correção de erro é conforto, não requisito. Pode ser cortada sem invalidar a
feature.

**Independent Test**: curtir um animal, desfazer, confirmar que ele voltou ao topo da pilha e saiu
dos favoritos; repetir com um animal pulado.

**Acceptance Scenarios**:

1. **Given** uma decisão acabou de ser tomada, **When** a pessoa aciona desfazer, **Then** o animal
   retorna ao topo da pilha e o efeito é revertido: o favorito é removido, ou a exclusão da sessão é
   desfeita.
2. **Given** nenhuma decisão tomada ainda nesta visita, **When** a tela carrega, **Then** o controle
   de desfazer não está disponível.
3. **Given** a reversão do favorito falha no servidor, **When** o erro ocorre, **Then** a pessoa é
   informada de que o animal continua nos favoritos e recebe o caminho para removê-lo.

### Edge Cases

- CEP válido cujo município não existe na base seedada (município novo, base desatualizada) deve
  impedir a conclusão silenciosa com dado incoerente e apresentar erro acionável no campo.
- Adotante e responsável na mesma coordenada devem produzir distância exibida como "menos de 1 km",
  nunca "0 km" nem valor negativo.
- Coordenadas em hemisférios ou fusos distantes (extremo norte de Roraima e extremo sul do Rio Grande
  do Sul) devem produzir distância correta, sem erro de sinal.
- Curtir e pular disparados em sequência muito rápida não podem duplicar favoritos nem pular dois
  animais com um gesto.
- Sessão expirada durante o uso do feed deve interromper com mensagem clara e caminho para reautenticar,
  sem perder silenciosamente curtidas já confirmadas.
- Animal que deixa de estar `DISPONIVEL` entre a montagem do lote e a decisão da pessoa deve falhar o
  curtir com mensagem específica, sem quebrar a pilha.
- Pilha remontada após troca de filtro não deve reapresentar animais já pulados nesta sessão.
- Aba duplicada do navegador tem `sessionStorage` próprio; reapresentar animais pulados na outra aba
  é comportamento aceito e não é defeito.
- Município escolhido manualmente deve sobreviver à navegação dentro da sessão, sem repetir a pergunta
  a cada entrada no feed.

---

## Requirements *(mandatory)*

### A. Localização e geocoding

- **FR-001**: O sistema DEVE manter uma base de municípios brasileiros com código IBGE, nome, nome
  normalizado para busca, UF e coordenada do centroide, populada por seed idempotente e versionada no
  repositório. O seed DEVE ser seguro para reexecução e NÃO DEVE apagar nem sobrescrever dados de
  outras entidades.
- **FR-002**: O cadastro de organização, acolhedor independente e adotante DEVE exigir CEP. A partir
  do CEP, o sistema DEVE preencher logradouro, cidade e UF, mantendo os campos editáveis para
  correção de complemento e número.
- **FR-003**: A coordenada de uma pessoa ou responsável DEVE vir do **centroide do seu município**,
  resolvido a partir da tabela de FR-001, e DEVE ser persistida no momento da escrita. Nenhum
  caminho de leitura — incluindo a montagem do feed — DEVE chamar serviço externo.
- **FR-004**: A consulta de CEP DEVE ser feita através de uma interface única de provedor, com a
  implementação ativa selecionada por variável de ambiente. O provedor DEVE devolver, de forma
  normalizada: endereço, cidade, UF e **código IBGE do município**, além de distinguir três
  desfechos — encontrado, CEP inexistente e serviço indisponível — independentemente de o provedor
  sinalizar isso por status HTTP ou por campo no corpo da resposta.
- **FR-005**: O provedor de CEP NÃO DEVE ser fonte de coordenada. Sua indisponibilidade NÃO DEVE
  impedir cadastro nem edição: nesse caso a pessoa DEVE poder escolher o município a partir da
  tabela de FR-001, e a coordenada resultante é idêntica à que teria sido obtida com o provedor no ar.
- **FR-006**: Toda coordenada persistida DEVE registrar sua origem — hoje sempre `MUNICIPIO` — para
  permitir refinamento posterior apenas do que precisar, sem varrer a base inteira.
- **FR-007**: O sistema NÃO DEVE persistir organização, acolhedor ou adotante sem localização válida.
  Um registro sem coordenada é estado inválido, não é caso a ser tratado no feed.
- **FR-008**: A localização de um animal DEVE ser derivada da localização do seu responsável
  (organização ou acolhedor). O modelo `Animal` NÃO DEVE receber campos de coordenada.
- **FR-009**: A distância entre dois pontos DEVE ser calculada por Haversine, em quilômetros, e
  exibida arredondada; abaixo de 1 km, DEVE ser apresentada como "menos de 1 km".
- **FR-010**: A resposta do provedor de geocoding DEVE ter tempo limite definido, e o esgotamento
  desse limite DEVE acionar o comportamento de FR-005 em vez de propagar erro à pessoa.

### B. Feed de descoberta

- **FR-011**: O feed DEVE existir em rota própria e protegida, acessível somente a usuário
  autenticado, ativo e de perfil adotante. Visitante DEVE ser direcionado a login ou cadastro; outros
  perfis DEVEM receber tratamento explícito de perfil sem acesso, coerente com o restante do produto.
- **FR-012**: O cartão DEVE apresentar um animal por vez, com a foto ocupando a maior parte da área
  e o conteúdo em três níveis de hierarquia decrescente: **(1)** nome e idade estimada; **(2)**
  espécie e porte numa frase concordada em gênero — "Gata pequena", "Cachorro grande"; **(3)** sexo,
  cidade/UF e distância aproximada. O cartão NÃO DEVE exibir raça nem etiquetas de saúde: raça é
  opcional no schema e está ausente em toda a base, e as etiquetas repetiriam porte e sexo, que já
  aparecem no texto. Ambos permanecem no perfil do animal.
- **FR-012a**: O texto sobre a foto DEVE ter fundo próprio que garanta contraste WCAG AA
  independentemente da imagem, já que a luminosidade das fotos é imprevisível.
- **FR-013**: O feed DEVE incluir somente animais com status `DISPONIVEL`, excluindo os que a pessoa
  já favoritou, aqueles para os quais ela já possui solicitação de adoção, e os pulados na sessão
  atual.
- **FR-014**: Os animais DEVEM ser ordenados por distância crescente a partir da posição da pessoa,
  sempre — independentemente de haver ou não filtro de raio ativo.
- **FR-015**: O feed DEVE oferecer filtro opcional de raio com os valores 25, 50, 100 e 200 km e a
  opção de qualquer distância, sendo **qualquer distância** o padrão inicial. DEVE oferecer também
  filtro de espécie com cão, gato e todos.
- **FR-015a**: O feed DEVE nomear as cidades alcançadas pelo critério atual, da mais próxima à mais
  distante. "50 km" é abstrato; "Volta Redonda, Barra Mansa e Resende" diz à pessoa o que ela está
  vendo. A contagem DEVE considerar toda a pilha, não apenas os cartões já carregados.
- **FR-016**: O feed DEVE ser carregado em lotes e buscar o lote seguinte antes de a pilha visível
  acabar, de modo que a pessoa não espere entre um cartão e o próximo em uso contínuo.
- **FR-017**: A posição da pessoa DEVE ser resolvida nesta ordem: coordenada do navegador quando a
  permissão for concedida; coordenada do próprio cadastro; município escolhido manualmente. A
  ausência ou negação de permissão NÃO DEVE bloquear o feed.
- **FR-018**: A escolha manual de município DEVE usar a base de municípios de FR-001 e persistir pela
  sessão de navegação, sem repetir a pergunta a cada entrada no feed.
- **FR-019**: O estado de pilha esgotada DEVE explicar o motivo e apresentar somente as ações
  aplicáveis àquele contexto: ampliar raio quando houver raio ativo, trocar espécie quando houver
  filtro de espécie, além de favoritos e vitrine.
- **FR-020**: Falha ao carregar um lote DEVE preservar os cartões já disponíveis, comunicar erro
  recuperável e oferecer nova tentativa, sem descartar decisões já confirmadas.
- **FR-021**: O cartão DEVE apresentar todas as fotos reais do animal em carrossel, com indicação de
  posição e total; a navegação entre fotos NÃO DEVE disparar curtir nem pular. Animal com uma única
  foto NÃO DEVE exibir controles de navegação.
- **FR-022**: O cartão DEVE oferecer caminho para abrir o perfil público completo do animal sem
  destruir a pilha atual.

### C. Decidir: curtir e pular

- **FR-023**: Curtir DEVE gravar o animal nos favoritos do adotante e NÃO DEVE criar solicitação de
  adoção, iniciar conversa, nem gerar notificação para o responsável.
- **FR-024**: Pular DEVE remover o animal da pilha da sessão atual e NÃO DEVE ser persistido no banco
  em nenhuma forma. A exclusão DEVE viver em `sessionStorage` e desaparecer ao fim da sessão de
  navegação.
- **FR-025**: Curtir e pular DEVEM ser acionáveis por quatro caminhos equivalentes: arraste por
  toque, arraste por ponteiro, botões visíveis e teclado. Todos DEVEM produzir exatamente o mesmo
  efeito.
- **FR-025a**: As setas ← → DEVEM valer na tela inteira, sem exigir que a pessoa clique no cartão
  antes. Um atalho que só funciona depois de um clique não é descoberto por ninguém, e em notebook o
  teclado é o gesto natural. O atalho NÃO DEVE agir quando o foco estiver num campo de texto ou
  seleção, nem quando a tecla estiver sendo segurada — segurar varreria a pilha inteira decidindo
  tudo de uma vez.
- **FR-026**: Um arraste abaixo do limiar de decisão DEVE retornar o cartão à posição original sem
  registrar ação. O limiar DEVE ser o mesmo para toque e ponteiro.
- **FR-027**: Ações repetidas antes da confirmação do servidor NÃO DEVEM duplicar favoritos nem
  consumir mais de um cartão por gesto.
- **FR-028**: Desfazer DEVE reverter a última decisão da visita — removendo o favorito ou anulando a
  exclusão da sessão — e devolver o animal ao topo da pilha. Falha na reversão DEVE informar o estado
  real e o caminho de correção.

### D. Privacidade

- **FR-029**: A coordenada de organizações e acolhedores NÃO DEVE cruzar a fronteira HTTP em nenhuma
  resposta. O feed DEVE expor apenas distância arredondada, cidade e UF.
- **FR-030**: A coordenada obtida do navegador DEVE ser arredondada antes de ser enviada ao servidor,
  com precisão suficiente para ordenar por proximidade e insuficiente para identificar residência.
- **FR-031**: Coordenadas NÃO DEVEM aparecer em parâmetros de URL persistidos no histórico, em logs
  de aplicação, nem em qualquer interface. Nenhuma tela DEVE exibir latitude ou longitude.

### E. Acessibilidade e interação

- **FR-032**: Todas as ações do feed — curtir, pular, desfazer, navegar fotos, ajustar raio e espécie,
  abrir perfil — DEVEM ser operáveis por teclado, com foco visível, ordem de foco coerente com a
  ordem visual e alvos de no mínimo 24 × 24 CSS px, mantendo o padrão da feature 004.
- **FR-033**: A troca de cartão, o resultado de cada decisão e a chegada de novos lotes DEVEM ser
  anunciados por região viva acessível, para que quem usa leitor de tela saiba o que aconteceu sem
  depender do movimento.
- **FR-034**: Com `prefers-reduced-motion` ativo, a interface NÃO DEVE animar deslize, rotação nem
  empilhamento; o resultado funcional DEVE permanecer idêntico.
- **FR-035**: O feed NÃO DEVE depender de cor para comunicar curtir, pular ou distância; cada um DEVE
  ter texto, ícone ou forma além da cor, com contraste WCAG 2.2 AA.

### Non-Functional Requirements

- **NFR-001**: Em 375 px, 1024 px e 1440 px, o feed NÃO DEVE apresentar rolagem horizontal da página,
  e o cartão DEVE caber na viewport sem exigir rolagem para alcançar as ações principais.
- **NFR-002**: Em 200% de zoom, cartão, ações e filtros DEVEM permanecer alcançáveis, refluindo sem
  sobreposição nem perda de informação.
- **NFR-003**: O caminho de leitura do feed NÃO DEVE realizar chamada a serviço externo. O custo de
  API por swipe DEVE ser zero, independentemente do volume de uso.
- **NFR-004**: A montagem de um lote NÃO DEVE carregar em memória o conjunto nacional de animais para
  então ordenar. A redução do conjunto candidato DEVE acontecer no banco antes do cálculo de
  distância, de modo que o custo por lote não cresça proporcionalmente à base nacional.
- **NFR-005**: O seed da base de municípios DEVE ser executável contra um banco já povoado sem perda
  de dados e sem duplicar registros em reexecuções.
- **NFR-006**: A homologação DEVE usar apenas as contas e dados de teste já autorizados, sem expor
  credenciais, tokens, CEPs reais de terceiros ou coordenadas em evidência.

### Constitution Requirements *(mandatory)*

- **CR-001**: A interface de provedor de geocoding é justificada por FR-004 e FR-005 e tem duas
  implementações previstas desde o início (provedor externo e fallback por centroide); não é
  abstração especulativa. A base de municípios tem dois consumidores (fallback de coordenada e
  escolha manual de município), satisfazendo o princípio de abstração usada em dois lugares
  concretos.
- **CR-002**: Toda mudança de dados começa em `prisma/schema.prisma` e flui por migration Prisma:
  nova entidade de município, campos de CEP, coordenada e precisão nas três entidades de pessoa.
- **CR-003**: Sem SQL cru em código de aplicação. O corte geográfico DEVE ser expresso em consulta
  Prisma por faixa de latitude e longitude, e a distância exata DEVE ser calculada no servidor sobre
  o conjunto já reduzido. Ordenação por Haversine diretamente no banco exigiria SQL cru e, portanto,
  emenda constitucional — **não autorizada nesta feature**.
- **CR-004**: A rota do feed chama `getServerSession()` e valida perfil adotante ativo antes de
  qualquer leitura de dados. O contrato retorna DTO estreito, sem coordenada, sem dados do
  responsável além de nome público, cidade e UF.
- **CR-005**: Validação Zod no cliente para feedback e Zod no servidor como fronteira de segurança,
  para CEP, coordenada recebida do navegador, raio, espécie e lista de exclusão.
- **CR-006**: Estado do cliente limitado a apresentação e interação transitória: pilha visível,
  cartão em arraste, pulados da sessão, filtros e município escolhido. Nada disso é fonte de verdade
  de produto; favoritos continuam sendo verdade no servidor.
- **CR-007**: Nenhuma dependência nova é requisito. Arraste, animação e cálculo de distância são
  atendidos pelo stack atual; qualquer proposta de biblioteca de gesto ou de mapa deve demonstrar no
  plano que o stack não atende.
- **CR-008**: TypeScript strict, sem `any` explícito, tipos derivados do Prisma.
- **CR-009**: Rotas que aplicam autorização e regra de negócio — feed, geocoding na escrita, curtir —
  recebem teste Vitest derivado do FR correspondente, vermelho contra implementação ausente ou
  ingênua.

### Key Entities

- **Município**: referência nacional de municípios com código IBGE, nome, nome normalizado, UF e
  coordenada do centroide. Dado de referência, populado por seed; não é criado por pessoa usuária.
- **Localização de pessoa/responsável**: CEP, endereço, cidade, UF, coordenada e precisão da
  coordenada, pertencentes a organização, acolhedor independente e adotante. A coordenada é privada e
  nunca sai do servidor.
- **Cartão de descoberta**: projeção somente-leitura de um animal disponível para o feed — dados
  públicos do animal, fotos reais, cidade/UF e distância aproximada. Não é entidade persistida.
- **Pilha da sessão**: conjunto efêmero de animais já decididos nesta sessão de navegação, vivendo no
  navegador. Não é persistido e não é fonte de verdade.
- **Favorito**: entidade já existente. Continua sendo o único destino do curtir, sem mudança de
  contrato nem de significado.

---

## Impacto em dados e migração

| Mudança | Entidades | Observação |
|---|---|---|
| Nova entidade de município | — | Seed idempotente por código IBGE; base versionada no repositório |
| CEP | Organizacao, AcolhedorIndependente, Adotante | Obrigatório no formulário desde o início |
| Coordenada + precisão | Organizacao, AcolhedorIndependente, Adotante | Nunca exposta em resposta HTTP |
| Nenhuma mudança | Animal, Favorito, SolicitacaoAdocao, Notificacao | Localização do animal vem do responsável |

**Registros existentes.** Há dados no Neon (5 contas de teste, 36 animais) sem CEP e sem coordenada.
A coluna não pode nascer obrigatória no banco sem quebrar esses registros. A sequência DEVE ser:
criar as colunas como opcionais, preencher os registros existentes a partir da cidade/UF que já
possuem — o que gera precisão `MUNICIPIO` — e só então tornar a obrigatoriedade efetiva na validação
de escrita. FR-007 é garantido pela validação do servidor, não por restrição de coluna, enquanto o
backfill não estiver concluído em todos os ambientes.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos cadastros novos de organização, acolhedor e adotante concluem com coordenada
  persistida, inclusive com o provedor de geocoding indisponível.
- **SC-002**: 0 chamadas a serviço externo de geocoding são disparadas ao montar, paginar ou filtrar o
  feed, medido em uma sessão completa de swipe do primeiro ao último cartão.
- **SC-003**: 100% dos cartões de uma pilha aparecem em ordem de distância não decrescente.
- **SC-004**: 0 respostas do feed contêm latitude ou longitude de responsável, verificado na resposta
  bruta recebida pelo navegador.
- **SC-005**: 100% dos curtires confirmados aparecem em `/meus-favoritos`, e 0 solicitações de adoção
  e 0 notificações são geradas por curtir.
- **SC-006**: 0 animais já favoritados, já solicitados ou já pulados na sessão reaparecem na pilha.
- **SC-007**: 100% das ações do feed são executáveis somente por teclado, do primeiro ao último cartão
  de uma pilha, com foco visível em todos os controles.
- **SC-008**: 0 rotas afetadas apresentam rolagem horizontal da página em 375 px, 1024 px, 1440 px ou
  200% de zoom.
- **SC-009**: 100% dos fluxos homologados nas features 003 e 004 seguem passando após a mudança nos
  formulários de cadastro e perfil, incluindo a suíte de 223 testes do backend.
- **SC-010**: O feed permanece utilizável com o provedor de geocoding desligado, comprovado por
  execução com a integração externa desabilitada.

---

## Dependencies

- Base de municípios do IBGE obtida uma vez e versionada no repositório; sem ela não há fallback de
  coordenada nem escolha manual de município.
- Provedor de geocoding gratuito e sem chave para a implementação inicial, acessível a partir do
  servidor em desenvolvimento e em produção.
- Contratos de favoritos e de vitrine já homologados na feature 003 permanecem a referência de
  regressão; o feed reaproveita o significado de favorito sem alterá-lo.
- Padrões de foco, estados e acessibilidade estabelecidos na feature 004 são o piso de qualidade da
  interface nova.
- Ambiente Neon com as contas de teste e os 36 animais disponíveis para homologação com distância
  real entre cidades diferentes.

## Assumptions

- Geocodificar na escrita mantém o custo de API proporcional ao número de responsáveis cadastrados, e
  não ao número de swipes; é isso que torna a projeção de volume alto viável em plano gratuito.
- Precisão de CEP é suficiente para a decisão de adoção; precisão de rua não muda a escolha de
  ninguém e aumentaria a exposição de endereço de acolhedor pessoa física.
- A base de municípios muda raramente; atualizar por novo seed quando necessário é aceitável.
- Rejeição efêmera é escolha de produto, não limitação: reencontrar um animal semanas depois é
  desejável, e evita construir um histórico de rejeição sobre animais.
- Os 36 animais de teste estão concentrados em poucas cidades; validar ordenação por distância pode
  exigir ajustar o CEP de alguns responsáveis de teste para cidades diferentes.
- Curtir sem triagem aprovada é permitido, coerente com o contrato atual de favoritos, que exige
  apenas adotante ativo.

## Out of Scope

- Match recíproco, "curtiu de volta", chat iniciado por curtir ou qualquer aviso ao responsável.
- Recomendação, aprendizado de preferência, reordenação por comportamento ou qualquer forma de
  algoritmo de afinidade além da distância.
- Mapa, pin, visualização geográfica ou exibição de coordenada em qualquer tela.
- Persistência de rejeição, histórico de swipe, métricas de engajamento por animal.
- Substituir a vitrine: `/vitrine` continua existindo com seus filtros completos, e o feed é um
  caminho paralelo de descoberta.
- Geocoding de precisão de rua, self-host de serviço de mapas, provedor pago.
- Alterar o fluxo de solicitação de adoção, triagem, chat ou notificações.
- Aplicativo nativo, notificação push e uso offline.
