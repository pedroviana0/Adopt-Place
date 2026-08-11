# Base de municípios

`municipios.csv` — 5.571 municípios brasileiros com código IBGE, nome, UF e coordenada do
centroide. É a **fonte de coordenada** do AdoptPlace: a localização de organizações, acolhedores e
adotantes é o centroide do município deles.

Colunas: `codigo_ibge,nome,uf,latitude,longitude`

## Por que uma tabela e não uma API

Medimos as APIs de CEP gratuitas antes de decidir. O campo de coordenada delas é o **centroide do
município**, não do endereço: quatro CEPs de São Paulo em zonas opostas devolvem a mesma
coordenada. Ou seja, a API não entrega precisão que esta tabela não dê — e esta não depende de
rede, não tem limite de uso e não cai.

A API de CEP continua sendo usada, para validar o CEP e resolver o **código IBGE**, que é a chave
de junção com esta tabela.

## Origem e licença

Derivado de <https://github.com/kelvins/municipios-brasileiros> (MIT, © 2016 Kelvin S. do Prado),
que por sua vez deriva de dados públicos do IBGE. Reduzido às colunas usadas aqui e com a UF
resolvida a partir do código numérico.

## Atualizar

Municípios mudam raramente (criação, fusão, mudança de nome). Para atualizar, baixe o CSV de
origem, reduza às cinco colunas acima e rode o seed — ele é idempotente e faz upsert por
`codigo_ibge`.
