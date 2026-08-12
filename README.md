# AdoptPlace

O AdoptPlace conecta animais resgatados a famílias interessadas em adoção responsável na região
de Volta Redonda/RJ. A plataforma atende adotantes, organizações protetoras, acolhedores
independentes e administradores durante todo o ciclo da adoção.

Projeto de Trabalho de Conclusão de Curso do IFRJ Campus Pinheiral, com apresentação prevista para 2026.

## Funcionalidades

- Vitrine pública com filtros, paginação e detalhes dos animais disponíveis.
- Feels: descoberta de animais por cartões, favoritos e distância entre municípios.
- Cadastro de adotantes, organizações e acolhedores independentes.
- Triagem do adotante e acompanhamento de solicitações de adoção.
- Perfis públicos de organizações e acolhedores, com catálogo próprio filtrável.
- Busca de organizações por nome, ignorando caixa e acentuação.
- Perfis restritos de adotantes para responsáveis com vínculo de solicitação.
- Gestão de animais, fotografias, saúde, documentos e adoções concluídas.
- Mensagens após aprovação, notificações internas e administração de contas.
- Temas claro e escuro, layout responsivo e suporte a movimento reduzido.

### Privacidade por perfil

As respostas públicas não expõem CPF, CNPJ, e-mail, telefone ou coordenadas. Endereço público
completo existe somente para organizações. Acolhedores e adotantes exibem apenas o município.

A triagem e o endereço completo do adotante são selecionados pelo servidor somente para o próprio
adotante, para a administração ou para um responsável que tenha ou tenha tido uma solicitação
daquele adotante.

## Arquitetura

O repositório contém dois aplicativos TypeScript independentes:

| Camada           | Diretório                            | Tecnologias                                                           |
| ---------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Backend e API    | raiz, `app/api/`, `lib/` e `prisma/` | Next.js 15, NextAuth, Prisma, PostgreSQL e Zod                        |
| Frontend oficial | `frontend/`                          | TanStack Start, React 19, Vite, React Query, Tailwind CSS e shadcn/ui |

Em desenvolvimento, o Vite encaminha `/api/*` para o backend em `http://localhost:3000`. O
frontend fica disponível em `http://localhost:8080`, preservando a autenticação por cookie na
mesma origem vista pelo navegador.

> `legacy/` contém uma interface histórica e não faz parte da aplicação atual.

## Pré-requisitos

- Node.js 18 ou superior.
- npm.
- PostgreSQL acessível localmente ou por um provedor compatível, como Neon.
- Credenciais do Uploadthing apenas para testar uploads reais.

## Configuração

1. Instale as dependências dos dois aplicativos:

```bash
npm install
npm --prefix frontend install
```

2. Copie o arquivo de ambiente e preencha os valores:

```bash
cp .env.example .env
```

| Variável            | Finalidade                                                                             |
| ------------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_URL`      | String de conexão com o PostgreSQL                                                     |
| `NEXTAUTH_SECRET`   | Segredo de sessão; gere com `openssl rand -base64 32`                                  |
| `NEXTAUTH_URL`      | Em desenvolvimento, `http://localhost:3000`; em produção, a origem pública do frontend |
| `UPLOADTHING_TOKEN` | Token da aplicação no Uploadthing                                                      |

3. Prepare o Prisma e aplique as migrations:

```bash
npm run prisma:generate
npx prisma migrate deploy
```

4. Opcionalmente, carregue os dados de demonstração:

```bash
npm run prisma:seed
```

> O seed recria as contas e os dados de teste. Executá-lo novamente invalida as sessões abertas.
> Não execute seed, reset ou migrations destrutivas contra o banco de produção.

## Executando localmente

Abra dois terminais na raiz do repositório.

Backend:

```bash
npm run dev
```

Frontend:

```bash
npm --prefix frontend run dev
```

Acesse [http://localhost:8080](http://localhost:8080).

Os scripts `predev` verificam as portas 3000 e 8080 e interrompem a inicialização quando já existe
outro servidor ativo. Isso evita executar instâncias concorrentes e servir código desatualizado.

## Contas de demonstração

O seed atual cria sete contas. A senha compartilhada é `AdoptPlace@2026`.

| E-mail                            | Perfil        | Estado de demonstração       |
| --------------------------------- | ------------- | ---------------------------- |
| `admin.teste@example.com`         | Administração | Gestão de contas             |
| `organizacao.teste@example.com`   | Organização   | Organização de Volta Redonda |
| `organizacao.resende@example.com` | Organização   | Organização de Resende       |
| `acolhedor.teste@example.com`     | Acolhedor     | Acolhedor de Volta Redonda   |
| `acolhedor.angra@example.com`     | Acolhedor     | Acolhedor de Angra dos Reis  |
| `adotante.aprovado@example.com`   | Adotante      | Triagem concluída            |
| `adotante.pendente@example.com`   | Adotante      | Triagem pendente             |

O conjunto inclui organizações com nomes acentuados, animais disponíveis e responsáveis em
municípios diferentes para validar busca normalizada, filtros e ordenação por distância.

## Qualidade e testes

Backend, na raiz:

```bash
npx tsc --noEmit
npm test
npm run prisma:validate
```

Frontend:

```bash
npm --prefix frontend exec tsc -- --noEmit
npm --prefix frontend run build
```

Não execute o build enquanto o servidor de desenvolvimento correspondente estiver ativo: ambos
escrevem nos mesmos diretórios de saída.

## Estrutura principal

```text
app/api/                 endpoints HTTP do backend
lib/                     autenticação, queries, schemas e integrações
prisma/                  schema, migrations, seed e dados municipais
__tests__/               testes Vitest do backend e contratos
frontend/src/routes/     páginas do frontend TanStack
frontend/src/components/ componentes de interface e produto
frontend/src/lib/data/   clientes tipados para /api
specs/                   especificações, planos e registros de entrega
```

## Deploy

A arquitetura de produção usa PostgreSQL no Neon e dois projetos na Vercel: um para o backend
Next.js e outro para o frontend TanStack. O frontend encaminha `/api/*` para o backend, mantendo a
autenticação na mesma origem pública.

O roteiro completo, incluindo variáveis, rewrite e checklist pós-deploy, está em
[`DEPLOY.md`](./DEPLOY.md).

## Documentação do projeto

- [`CLAUDE.md`](./CLAUDE.md): contexto canônico, arquitetura e guardrails.
- [`specs/README.md`](./specs/README.md): índice das funcionalidades especificadas.
- [`specs/006-perfis-publicos/ENTREGA.md`](./specs/006-perfis-publicos/ENTREGA.md): entrega mais
  recente, decisões de privacidade e evidências.
- [`DEPLOY.md`](./DEPLOY.md): publicação do sistema.
