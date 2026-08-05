# UI Pattern Contracts

Estes contratos são de apresentação, não HTTP e não modificam os contratos da feature 003.

| Padrão | Garantia de interface | Limite |
|---|---|---|
| Navegação | destinos por papel, item atual perceptível, foco restaurado | não decide permissão |
| Confirmação | contexto, cancelar, foco contido/restaurado | não altera semântica da mutação |
| Estado assíncrono | loading, vazio, erro e próxima ação | não muda query, DTO ou erro de backend |
| Lista responsiva | compacto no desktop, card/linha no mobile se necessário | não cria filtro/coluna sem contrato |
| Mídia animal | foto real atual ou placeholder neutro | não cria/edita foto nem chama novo serviço |

Cada padrão deve comunicar estado com mais de cor e manter foco visível AA.
