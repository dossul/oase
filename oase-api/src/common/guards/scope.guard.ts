import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ScopeService, ResourceType } from '../services/scope.service';
import { AuthUser } from '../../auth/auth.service';

export const SCOPE_RESOURCE_KEY = 'scope_resource';
export const ScopeResource = (resource: ResourceType) => SetMetadata(SCOPE_RESOURCE_KEY, resource);

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private scope: ScopeService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.getAllAndOverride<ResourceType>(SCOPE_RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!resource) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: AuthUser; params: { id?: string } }>();
    const { user, params } = request;

    if (!user) {
      throw new ForbiddenException({ code: 'UTILISATEUR_NON_AUTHENTIFIE' });
    }

    const resourceId = params.id;
    if (!resourceId) {
      return true;
    }

    const allowed = await this.scope.isAllowed(user, resource, resourceId);
    if (!allowed) {
      throw new ForbiddenException({ code: 'PERIMETRE_NON_AUTORISE' });
    }

    return true;
  }
}
