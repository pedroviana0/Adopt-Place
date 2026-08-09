# Prompt de continuidade — para retomar o AdoptPlace em qualquer sessão de IA

Este arquivo tem duas partes:

- **Parte A — modelo reutilizável.** Serve para iniciar **qualquer** spec, com qualquer sistema de
  IA. Troque o que está `<entre colchetes>`.
- **Parte B — instância pronta da spec 006**, para copiar e colar como está.

O objetivo é que uma sessão nova chegue ao mesmo nível de contexto sem repetir o levantamento —
e, principalmente, **sem reverter em silêncio decisões que já custaram caro**.

---

## Parte A — modelo reutilizável

```
Vou retomar o AdoptPlace (TCC, IFRJ Pinheiral). O repositório de trabalho é:
<caminho absoluto do clone>

ANTES DE QUALQUER COISA, leia nesta ordem e por completo:

1. CLAUDE.md na raiz — contexto canônico do projeto. Leia inteiro. As seções que mais
   custam se ignoradas são a 2 (governança), a 5 (portão), a 9.2 (regra de continuidade
   entre specs), a 10 (estado atual) e a 11 (armadilha do CEP).
2. specs/README.md — índice de todas as specs, com o estado de cada uma.
3. specs/<spec anterior>/ENTREGA.md — o que a spec anterior REALMENTE entregou, o que
   ela NÃO entregou, e as decisões que não se reabrem. Isto é exigência da seção 9.2 do
   CLAUDE.md, não sugestão.
4. specs/<spec atual>/spec.md — o que você vai executar. Já está aprovada.
5. specs/<spec atual>/ENTREGA.md — o registro em andamento, que você vai preencher.

Se depois disso ainda não estiver claro POR QUE o sistema é como é, leia também o
ENTREGA.md de duas specs atrás. Duas para trás é o piso, não o teto: você precisa
entender tudo que já foi entregue até aqui.

Quando o código real divergir do que uma spec antiga prometeu, a ordem de autoridade é:
código real > ENTREGA.md > CLAUDE.md > spec.md. Não escolha em silêncio — registre a
divergência e me traga.

TAREFA: <o que executar>

FLUXO DE TRABALHO
Todo trabalho nasce em branch própria, nunca direto na main, e entra por PR. Uma branch
por feature, não por commit; dentro dela, commits pequenos. Não há revisor externo — o PR
existe como ponto de parada e registro.

PORTÃO OBRIGATÓRIO antes de cada commit:
  backend:   npx tsc --noEmit   e   npm test
  frontend:  cd frontend; npx tsc --noEmit; npm run build
Se o build regenerar frontend/src/routeTree.gen.ts e você NÃO criou rota, reverta. Se
criou rota, commite o arquivo.

AMBIENTE (roda sem Docker — o banco é Neon, na nuvem)
Dois terminais na raiz do clone. É PowerShell 5.1: o separador é ";", não "&&".
  cd "<caminho>"; npm run dev                    # backend  :3000
  cd "<caminho>"; npm --prefix frontend run dev  # frontend :8080
O .env local já está configurado. Contas de teste, senha AdoptPlace@2026:
  adotante.aprovado@   adotante.pendente@   organizacao.teste@   organizacao.resende@
  acolhedor.teste@     acolhedor.angra@     admin.teste@         (todas @example.com)

ARMADILHAS QUE JÁ CUSTARAM TEMPO (estão no CLAUDE.md)
- "npm run prisma:seed" recria as contas e desloga a sessão do navegador. Tela em
  "Carregando…" logo após um seed é isso, não defeito.
- Não rode "npm run build" no frontend com o vite dev de pé: o build recria .output
  embaixo do watcher e derruba o dev server.
- Se :3000 ou :8080 já estiverem ocupados, há uma guarda que falha alto de propósito
  (scripts/porta-livre.mjs, ligada por predev). Se ela disparar, encerre o processo
  órfão em vez de subir em outra porta — dois servidores no mesmo .next corrompem o
  cache e produzem um 500 que não aponta para a causa.
- As APIs de CEP gratuitas NÃO geocodificam endereço. Isso foi medido. Leia a seção 11
  do CLAUDE.md antes de tocar em localização.
- lib/actions/*.ts e app/api/**/route.ts às vezes duplicam a mesma regra. Ao adicionar
  efeito colateral, instrumente a ROTA HTTP e valide de ponta a ponta.

COMO EU TRABALHO
- Verifique com evidência em vez de afirmar. Rode a consulta, abra a resposta, meça.
  Várias decisões boas deste projeto vieram de medir e descobrir que o pressuposto
  estava errado — inclusive a reversão inteira da estratégia de geolocalização.
- Teste na tela, não só no compilador. Vários defeitos desta base só apareceram
  abrindo o navegador e interagindo.
- Quando encontrar contradição entre o que eu pedi e o que os dados mostram, me traga o
  dado e a recomendação antes de construir.
- Toda regra de autorização e privacidade da spec precisa de teste Vitest que falhe se
  a proteção for removida.
- Pergunte quando a decisão for materialmente diferente conforme a resposta. Não
  pergunte o que dá para decidir com bom senso.
- Mensagens de commit em português, explicando o porquê, com trailer
  Co-Authored-By: Claude.
- Ao concluir cada fatia, preencha o ENTREGA.md da spec com o hash do commit. Sem hash
  não é registro, é lembrança.

Comece confirmando que leu os documentos acima, que a main está sincronizada, e me
proponha o plano de execução antes de escrever código.
```

---

## Parte B — instância pronta para a spec 006

```
Vou retomar o AdoptPlace (TCC, IFRJ Pinheiral). O repositório de trabalho é o clone do
github.com/pedroviana0/Adopt-Place.

ANTES DE QUALQUER COISA, leia nesta ordem e por completo:

1. CLAUDE.md na raiz — contexto canônico. Leia inteiro. Seções críticas: 2 (governança),
   5 (portão), 9.2 (regra de continuidade entre specs), 10 (estado atual) e 11
   (armadilha do CEP).
2. specs/README.md — índice das specs 001 a 006.
3. specs/005-feels/ENTREGA.md — a spec anterior. É obrigatório pela seção 9.2. Ela contém
   a reversão da estratégia de geolocalização e explica por que a coordenada de todo
   mundo vem do centroide do município, offline.
4. specs/006-perfis-publicos/spec.md — aprovada pelo mantenedor. É o que você vai executar.
5. specs/006-perfis-publicos/HANDOFF.md — o levantamento já feito: mapa de onde buscar
   cada informação, três achados medidos que mudam o desenho, e o plano em 8 ondas.
6. specs/006-perfis-publicos/ENTREGA.md — o registro em andamento, que você preenche a
   cada onda concluída.

Se restar dúvida sobre por que o sistema é como é, leia também
specs/004-ui-ux-redesign/ENTREGA.md (duas specs atrás) — ela explica por que a identidade
entregue é teal e âmbar, e não o verde oliva que a própria spec 004 descreve.

TAREFA: implementar a spec 006 — perfis públicos e busca por nome. Perfil de organização
com imagem, descrição, endereço e catálogo filtrável; acolhedor e adotante sem endereço
público; busca só de organizações; triagem e endereço do adotante apenas para quem tem ou
teve solicitação dele. Execute na ordem das ondas 0 a 7 do HANDOFF.md, uma onda por vez,
com o portão verde entre elas.

A branch 006-perfis-publicos já existe e está empilhada sobre a fix/guarda-de-porta-no-dev
(PR #121). Se o #121 já tiver sido mergeado na main quando você começar, rebase a 006 na
main antes de seguir.

TRÊS COISAS JÁ MEDIDAS QUE VOCÊ NÃO PRECISA REDESCOBRIR (detalhe no HANDOFF.md, §4):
1. O `mode: "insensitive"` do Prisma NÃO ignora acento — só caixa. Medido no banco real:
   `nome contains "sao paulo"` devolve 0 resultados; `nomeNormalizado contains "sao paulo"`
   devolve 4. Cumprir FR-012 exige coluna normalizada em Organizacao, reaproveitando
   normalizarNomeMunicipio() de lib/municipios.ts. NÃO escreva uma segunda função de
   normalização: se as duas divergirem, a busca para de achar em silêncio.
2. Os DTOs públicos de animal devolvem o responsável como texto puro, sem identificador.
   A US2 é impossível sem acrescentar responsavelId e responsavelTipo. No Feels o chip do
   responsável já é clicável, mas leva para a página do animal — a afordância existe, o
   destino é que está errado.
3. Tensão interna da spec: SC-002 proíbe telefone em qualquer resposta da feature, mas a
   tela de solicitação já mostra o telefone do adotante. Decisão tomada: o novo endpoint
   de perfil do adotante NÃO devolve telefone. Não reabra sem falar comigo.

DECISÕES DA 006 QUE NÃO SE REABREM (justificativa completa na spec):
1. A triagem do adotante não é pública. Vai apenas para: o próprio adotante, o responsável
   que tem OU TEVE solicitação daquele adotante, e a administração. Para quem não se
   enquadra, a triagem não pode nem sair da API — não basta esconder na tela. Ela contém
   composição familiar, idade das crianças, horas que a casa fica vazia e segurança de
   muros e janelas.
2. O endereço do adotante É exibido, mas só a esse mesmo público restrito, como dado de
   análise da solicitação. Nunca no perfil público.
3. Endereço no perfil público só de ORGANIZAÇÃO. Acolhedor e adotante mostram apenas o
   município. Acolhedor é pessoa física e o endereço dele é a casa dele.
4. A busca por nome retorna somente organizações. Adotantes e acolhedores não são
   pesquisáveis.
5. O vínculo que autoriza é a EXISTÊNCIA da solicitação, em qualquer status: em análise,
   aprovada, recusada ou concluída.

Toda regra de FR-016, FR-013 e FR-020 precisa de teste Vitest que FALHE se a proteção for
removida. Teste que passa com e sem a proteção não vale (CR-007).

FLUXO, PORTÃO, AMBIENTE E ARMADILHAS: iguais à Parte A deste arquivo. Baseline conferida
em 2026-08-09: 294 testes passando, tsc limpo nos dois lados, build do frontend completo.

Comece confirmando que leu os documentos, que a main está sincronizada, e me proponha o
plano da Onda 0 antes de escrever código.
```
