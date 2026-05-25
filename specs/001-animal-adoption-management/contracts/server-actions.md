# Server Action Contracts: Animal Adoption Management

All protected actions must call `getServerSession()`, reject inactive users, and
authorize by role and ownership before reading or writing protected data. All
inputs use shared Zod schemas from `lib/schemas/`.

## Authentication and Registration

### `registerAdopter(input)`

- **Input**: name, CPF, e-mail, phone, address, city, state, password.
- **Success**: Creates `Usuario` and `Adotante`; redirects to `/dashboard/triagem`.
- **Errors**: `E-mail já cadastrado`, `CPF já cadastrado`, validation errors.

### `registerOrganization(input)`

- **Input**: organization legal/contact fields and password.
- **Success**: Creates `Usuario` and `Organizacao`.
- **Errors**: duplicate e-mail/CNPJ, validation errors.

### `registerFoster(input)`

- **Input**: foster personal/contact fields and password.
- **Success**: Creates `Usuario` and `AcolhedorIndependente`.
- **Errors**: duplicate e-mail/CPF, validation errors.

### `saveScreening(input)`

- **Actor**: Adopter.
- **Success**: Updates standardized screening fields and `triagemConcluida`.
- **Errors**: unauthenticated, inactive account, non-adopter, validation errors.

## Animals and Photos

### `createAnimal(input)`

- **Actor**: Organization or independent foster.
- **Input**: animal fields, exactly one responsible owner implied by session,
  at least one primary photo.
- **Success**: Creates animal with status default `RESGATADO`.
- **Errors**: unauthenticated, inactive account, invalid owner XOR, missing
  primary photo, validation errors.

### `updateAnimal(animalId, input)`

- **Actor**: Owning organization or foster.
- **Success**: Updates animal fields/status.
- **Errors**: not owner, invalid owner XOR, validation errors.

### `deleteAnimal(animalId)`

- **Actor**: Owning organization or foster.
- **Success**: Deletes animal and cascaded photos/health records where allowed.
- **Errors**: not owner, protected lifecycle state if deletion is disallowed by
  implementation policy.

### `setPrimaryPhoto(animalId, photoId)`

- **Actor**: Owning organization or foster.
- **Success**: Makes exactly one photo primary.
- **Errors**: not owner, photo not found for animal.

## Health Records

### `createHealthRecord(animalId, input)`

- **Actor**: Owning organization or foster.
- **Success**: Creates vaccine, parasite-control, or disease-test record.
- **Errors**: not owner, future application date, next date not after record
  date, inconclusive test result, type-specific validation errors.

### `updateHealthRecord(recordId, input)`

- **Actor**: Owning organization or foster.
- **Success**: Updates record.
- **Errors**: not owner, same validation as create.

### `deleteHealthRecord(recordId)`

- **Actor**: Owning organization or foster.
- **Success**: Deletes record.
- **Errors**: not owner.

## Animal Relationships

### `linkAnimals(animalId, relatedAnimalId)`

- **Actor**: Owning organization or foster for the primary animal.
- **Success**: Creates `(A,B)` and `(B,A)` in one transaction.
- **Errors**: self-relationship error, not owner. Duplicate relationship is
  ignored.

### `unlinkAnimals(animalId, relatedAnimalId)`

- **Actor**: Owning organization or foster for the primary animal.
- **Success**: Removes `(A,B)` and `(B,A)`.
- **Errors**: not owner.

## Favorites

### `toggleFavorite(animalId)`

- **Actor**: Adopter.
- **Success**: Creates favorite if missing; deletes if present.
- **Errors**: unauthenticated redirect, inactive account, non-adopter.

## Adoption Requests

### `createAdoptionRequest(animalId)`

- **Actor**: Adopter.
- **Success**: Creates request with `EM_ANALISE`.
- **Errors**: unauthenticated redirect, incomplete screening redirect,
  duplicate active request, unavailable animal, inactive account.

### `decideAdoptionRequest(requestId, decision, observations)`

- **Actor**: Owning organization or foster.
- **Input**: decision `APROVADA` or `RECUSADA`, observations.
- **Success**: Approval sets request `APROVADA`, animal
  `EM_PROCESSO_ADOCAO`, and other in-analysis requests for the animal
  `RECUSADA`. Refusal sets request `RECUSADA` and leaves animal `DISPONIVEL`.
- **Errors**: not owner, invalid status transition.

### `completeAdoption(requestId)`

- **Actor**: Owning organization or foster.
- **Success**: Sets request `CONCLUIDA` and animal `ADOTADO`.
- **Errors**: not owner, request not approved.

## Administration

### `setUserActive(userId, active)`

- **Actor**: Admin.
- **Success**: Activates or deactivates user.
- **Errors**: non-admin, self-deactivation if implementation blocks it.
