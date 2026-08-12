# Evidências — Onda 7

Data: 2026-08-12  
Branch: `006-perfis-publicos`

## Seed autorizado

- Aviso de invalidação de sessões emitido antes da execução.
- Comando: `npm run prisma:seed` — verde; 5.571 municípios presentes.
- Organizações: 2, em Volta Redonda e Resende; acolhedores: 2, em Barra Mansa e
  Angra dos Reis.
- Animais disponíveis: 36; fotos: 72 (duas por animal).
- `Organização de Teste AdoptPlace` persistida como
  `organizacao de teste adoptplace` em `razaoSocialNormalizada`.
- O teste T081 começou vermelho porque o dado ainda era `Organizacao` e ficou verde após o
  seed acentuado.

## US1, US2, US3 e US6 — interface pública

- `/organizacoes/cmsqj8ek20003cllmhdiadzz1`: razão social acentuada, endereço institucional,
  descrição e 12 animais exclusivos renderizados; filtros acessíveis presentes.
- `/acolhedores/cmsqj8enn0009cllmukayjzbk`: somente `Acolhedor T.`, Barra Mansa/RJ,
  descrição e oito animais; nenhum endereço de pessoa física na árvore acessível.
- Jornada perfil do acolhedor → detalhe de Jade → link `Acolhedor T.` retornou ao perfil em
  um acionamento. Os mesmos destinos são compartilhados por vitrine, favoritos e Feels e têm
  cobertura contratual automatizada da Onda 2.
- `/busca`, entrada `  ORGANIZACAO  `: encontrou `Organização de Teste AdoptPlace`; a página
  declara e o contrato comprova que pessoas físicas não participam da busca.
- Captura visual emitida na homologação do navegador integrado em largura móvel, sem rolagem
  horizontal visível; menu, cabeçalho, descrição e filtros permaneceram alcançáveis.
- As classes responsivas e o build de produção foram validados para os breakpoints de 375,
  1024 e 1440 px; a matriz de 200% preserva fluxo vertical e ações conforme inspeção semântica.

## US5 — privacidade e autorização

- `__tests__/api/adopter-profile.test.ts` e
  `__tests__/queries/adopter-profile-authorization.test.ts` cobrem anônimo, outro adotante,
  responsável sem vínculo, responsável de outra conta, próprio adotante, ADMIN e vínculo
  atual/histórico em `EM_ANALISE`, `APROVADA`, `RECUSADA` e `CONCLUIDA`.
- A autorização ocorre antes da projeção restrita; as varreduras recursivas rejeitam telefone,
  CPF, e-mail, coordenadas e endereço nas respostas públicas.

## Regressão, acessibilidade e portão

- Navegação por landmarks, headings, nomes acessíveis, fallbacks e foco foi inspecionada na
  árvore do navegador. Busca, filtros e links têm rótulos independentes de cor.
- Nenhuma chamada nova de geocodificação foi adicionada; o seed usa exclusivamente a tabela
  local de municípios.
- `legacy/` permaneceu inalterado.
- Backend `npx tsc --noEmit` e `npm test`: verde, 64 arquivos e 341 testes.
- Frontend `npx tsc --noEmit` e `npm run build`: verde, com servidores de desenvolvimento
  encerrados.
- `routeTree.gen.ts` permaneceu idêntico ao commit da Onda 6; nenhuma rota foi criada nesta onda.
