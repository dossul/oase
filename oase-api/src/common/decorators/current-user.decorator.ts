import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Injecte l'utilisateur authentifié (req.user) ou l'une de ses propriétés.
 * - `@CurrentUser()` → l'objet AuthUser complet
 * - `@CurrentUser('id')` → user.id (string)
 */
export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  return data ? user?.[data] : user;
});
