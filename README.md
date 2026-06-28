# AdoptPlace

Plataforma de gestão do ciclo completo de adoção de animais resgatados: vitrine pública, registro e triagem de adotantes, gestão de animais e saúde por organizações e acolhedores independentes, solicitações de adoção, favoritos, histórico e administração de contas.

## Pré-requisitos

- **Node.js** 18 ou superior
- **PostgreSQL** (banco de dados de produção)
- **pnpm** ou **npm** como gerenciador de pacotes

## Configuração do ambiente

1. Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.example .env
```

2. Edite `.env` com os valores corretos:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL (ex: `postgresql://user:password@localhost:5432/adoptplace`) |
| `NEXTAUTH_SECRET` | Chave secreta para NextAuth — gere com `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL base da aplicação (ex: `http://localhost:3000`) |
| `UPLOADTHING_SECRET` | Chave do Uploadthing (upload de fotos) |
| `UPLOADTHING_APP_ID` | ID do app no Uploadthing |

## Banco de dados

Execute a migração inicial e o seed:

```bash
npx prisma migrate dev
npx prisma db seed
```

> O seed usa `tsx` automaticamente via configuração do Prisma. Se necessário, instale `tsx` globalmente com `npm i -g tsx`.

## Servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Testes

```bash
npm test
```

## Usuários do seed

A execução de `npx prisma db seed` cria os seguintes usuários (senha de todos: **`test1234`**):

| Email | Perfil | Observação |
|---|---|---|
| `org@ciaanimal.com` | Organização | Cia Animal VR — rede de acolhimento informal |
| `org@spavr.com` | Organização | SPA-VR — ONG com abrigo e capacidade para 120 animais |
| `acolhedor@teste.com` | Acolhedor Independente | Acolhedor Teste — capacidade atual: 2 |
| `adotante@teste.com` | Adotante | Adotante Triado — triagem concluída |
| `adotante2@teste.com` | Adotante | Adotante Sem Triagem — triagem pendente |
| `admin@adoptplace.com` | Admin | Administrador do sistema |

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript (strict) |
| ORM | Prisma 5.x |
| Banco de dados | PostgreSQL 16 |
| Autenticação | NextAuth v5 (Credentials) |
| Validação | Zod 3.x |
| Estilização | Tailwind CSS v4 + shadcn/ui |
| Upload | Uploadthing |
| Hash de senha | bcryptjs |
| Testes | Vitest |
| Lint | ESLint |
