# Research: Reforma de UI/UX

## Decisions

### Padrões existentes antes de dependências

**Decision**: reutilizar Tailwind, Radix/shadcn e Lucide já instalados.
**Rationale**: a auditoria já encontrou primitives e tokens; a feature é de consistência, não de substituição.
**Alternatives considered**: biblioteca nova de design system — rejeitada por duplicar capacidades e ampliar manutenção.

### Neutros quentes e terracota

**Decision**: neutros quentes são superfícies e bordas com temperatura visual levemente quente para fundo geral, cards, campos, divisores, texto secundário e superfícies elevadas. Eles não devem produzir cinza azulado predominante, branco frio em todas as superfícies, bege amarelado de baixo contraste, aparência sépia/envelhecida ou suavidade que reduza contraste.

**Decision**: terracota é acento secundário opcional e limitado para detalhes editoriais, ilustrações ou elementos decorativos, destaques não críticos e apoio pontual à identidade acolhedora. Não substitui o verde oliva primário, não domina grandes superfícies, não é indicador exclusivo de estado semântico, não colore todos os botões e não deve se repetir como decoração carregada.

**Rationale**: delimita a identidade aprovada sem congelar valores antes da baseline, comparação visual e contraste AA.

### Navegação mobile

**Decision**: menu modal/lateral acessível, com destinos derivados do papel atual.
**Rationale**: preserva todos os destinos desktop e evita barra inferior fora de escopo.
**Alternatives considered**: esconder links (falha FR-001); barra inferior (decisão aprovada contra).

### Imagens e placeholder

**Decision**: renderizar fotos reais dos DTOs atuais; ausência usa placeholder neutro de marca.
**Rationale**: evita conteúdo fictício e não exige fonte externa.
**Alternatives considered**: banco de imagens ou novos uploads — rejeitados por escopo e privacidade.

### Estados e confirmação

**Decision**: padrão compartilhado de loading/vazio/erro e confirmação contextual com foco restaurado.
**Rationale**: UX-02 a UX-04 demonstram inconsistência repetida.
**Alternatives considered**: mensagens locais por rota — rejeitadas por inconsistência e retrabalho.

### Qualidade e formatação

**Decision**: lint focado para alterações de frontend; registrar lint global CRLF/Prettier como débito.
**Rationale**: evita reforma massiva fora da feature e mantém sinal semântico.
**Alternatives considered**: reformatar todo frontend — rejeitado por alto risco/conflito.
