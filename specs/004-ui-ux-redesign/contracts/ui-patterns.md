# UI Pattern Contracts

Estes contratos são de apresentação, não HTTP e não modificam os contratos da feature 003.

| Padrão | Garantia de interface | Limite |
|---|---|---|
| Navegação | destinos separados por papel; item atual por texto/`aria-current` e segundo sinal; foco inicial, contido e restaurado | não decide permissão nem cria barra inferior |
| Confirmação | item, consequência, ação/cancelamento, foco inicial na ação segura, contenção e restauração | não altera semântica nem antecipa mutação |
| Estado assíncrono | consulta: loading/skeleton, conteúdo, vazio e erro; mutação: pending sem duplicação, erro preservando dados e sucesso anunciado | não muda query, DTO ou erro de backend |
| Formulário | rótulo, ajuda e erro associados; valores válidos preservados; foco no primeiro erro | não muda schema Zod, progressão ou regra existente |
| Lista responsiva | identificação, estado e ação simultâneos; compacto no desktop; card/linha em 375 px diante de overflow/perda desses campos | não cria filtro/coluna sem contrato |
| Filtro | estado ativo identificável, limpeza e vazio recuperável | não cria endpoint nem capacidade administrativa |
| Mídia animal | foto real com texto alternativo; ausência conhecida e falha de carregamento distintas | não cria conteúdo fictício nem muda Uploadthing |
| Identidade | oliva primário; neutros quentes para superfícies; terracota opcional não crítico; semânticas AA | não fixa token antes da baseline nem usa cor como pista única |

Cada padrão deve comunicar estado por mais de uma pista, seguir os contrastes de FR-015, os alvos de FR-014 e os estados aplicáveis definidos na matriz de `quickstart.md`.
