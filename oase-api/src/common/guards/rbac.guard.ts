import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/generated';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../../auth/auth.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: AuthUser }>();
    if (!user) {
      throw new ForbiddenException({ code: 'UTILISATEUR_NON_AUTHENTIFIE' });
    }

    if (!requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException({ code: 'ROLE_NON_AUTORISE' });
    }

    return true;
  }
}
