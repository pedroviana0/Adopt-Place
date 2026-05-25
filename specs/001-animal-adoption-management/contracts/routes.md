# Route Contracts: Animal Adoption Management

Most business mutations use Server Actions. Route Handlers are limited to
framework or integration boundaries.

## Public Routes

### `GET /`

- **Purpose**: Home page with public metrics and integrated animal showcase.
- **Query**: species, breed, size, sex, city, tags, page.
- **Access**: Public.
- **Data rules**: Only available animals. Responsible-party data limited to
  public name, city, and type.

### `GET /animais/[id]`

- **Purpose**: Public animal profile.
- **Access**: Public.
- **Data rules**: Gallery, attributes, derived tags, public health summary,
  related animals, and actions. No adopter-sensitive data or internal
  responsible-party data.

## Auth Routes

### `GET/POST /api/auth/[...nextauth]`

- **Purpose**: NextAuth v5 auth handling.
- **Access**: Public entry point, session-aware.
- **Rules**: Credentials provider validates password hash; session includes
  `tipoPerfil`, active status, and profile entity id.

### `GET /login`

- **Purpose**: User login.
- **Access**: Public.
- **Rules**: Accepts callback destination for protected action redirects.

### `GET /cadastro/*`

- **Purpose**: Role-specific registration pages.
- **Access**: Public.

## Upload Routes

### `GET/POST /api/uploadthing`

- **Purpose**: Uploadthing file upload integration.
- **Access**: Authenticated organization or foster.
- **Rules**: Validate role and ownership context before persisted photo
  references are associated with animals.

## Dashboard Routes

All dashboard routes require authenticated active users. Unauthorized role or
ownership access returns a forbidden result or redirects according to route type.

### `GET /dashboard`

- **Adopter**: triage status, requests, favorites.
- **Organization/Foster**: metrics, animals, requests, upcoming procedures.
- **Admin**: user-management entry point.

### `GET /dashboard/triagem`

- **Actor**: Adopter.
- **Purpose**: View/edit standardized screening form.

### `GET /dashboard/animais`

- **Actor**: Organization or foster.
- **Purpose**: Own animal management list and create flow.

### `GET /dashboard/animais/[id]/fotos`

- **Actor**: Owning organization or foster.
- **Purpose**: Manage up to 10 ordered photos and primary photo.

### `GET /dashboard/animais/[id]/saude`

- **Actor**: Owning organization or foster.
- **Purpose**: Manage health records.

### `GET /dashboard/animais/[id]/relacionados`

- **Actor**: Owning organization or foster.
- **Purpose**: Manage bidirectional related-animal links.

### `GET /dashboard/solicitacoes`

- **Actor**: Organization or foster.
- **Purpose**: List and decide requests for own animals.

### `GET /dashboard/favoritos`

- **Actor**: Adopter.
- **Purpose**: List saved favorite animals.

### `GET /dashboard/adotantes`

- **Actor**: Organization or foster.
- **Purpose**: Read-only completed adoption history for own animals.

### `GET /dashboard/admin/usuarios`

- **Actor**: Admin.
- **Purpose**: List users and activate/deactivate accounts.
