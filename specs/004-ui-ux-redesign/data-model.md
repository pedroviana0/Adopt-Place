# Data Model

Não há mudança de persistência nesta feature.

Os únicos conceitos introduzidos são estados transitórios de experiência (loading, vazio, erro, sucesso, foco, seleção, desabilitado e confirmação). Eles não são entidades, não têm schema Prisma, não são persistidos e não alteram DTOs, relacionamentos, ciclos de vida ou contratos existentes.
