import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../profile-role.lookup';

export const ROLES_KEY = 'roles';

/**
 * Marca um endpoint (ou controller) com os papéis exigidos para acesso.
 * Lido por `RolesGuard` via `Reflector`. Endpoint sem este decorator não é
 * afetado por `RolesGuard` (no-op — permite qualquer usuário autenticado).
 *
 * Ex.: `@Roles('admin')`.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
