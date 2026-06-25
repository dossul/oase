import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AuditService } from './audit.service';

/**
 * AuditLogInterceptor — enregistre automatiquement les mutations (POST/PATCH/DELETE).
 * Appliqué globalement dans main.ts :
 *   app.useGlobalInterceptors(new AuditLogInterceptor(auditService, reflector));
 *
 * Exclure une route de l'audit : @SetMetadata('skipAudit', true)
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  // Actions qui déclenchent l'audit
  private readonly AUDIT_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

  constructor(
    private audit: AuditService,
    private reflector: Reflector,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const skip = this.reflector.getAllAndOverride<boolean>('skipAudit', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (skip) return next.handle();

    const req = ctx.switchToHttp().getRequest();
    if (!this.AUDIT_METHODS.has(req.method)) return next.handle();

    const user = req.user;
    const before = new Date();

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          // Dérive entité + id depuis l'URL : /api/v1/demandes/:id/approuver
          const segments = req.url.replace(/^\/api\/v1\//, '').split('/');
          const entite = segments[0] ?? 'unknown';
          const entiteId = segments[1] ?? req.body?.id ?? 'unknown';

          const action = this.deriveAction(req.method, segments);

          await this.audit.createEntry({
            action,
            entite,
            entiteId: entiteId,
            demandeId: req.params?.id ?? req.body?.demandeId,
            utilisateurId: user?.id,
            roleAuMoment: user?.role,
            institution: user?.institution,
            nouvelleValeur: req.body ?? undefined,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          });
        } catch {
          // Erreur audit non bloquante — log silencieux
        }
      }),
    );
  }

  private deriveAction(method: string, segments: string[]): string {
    const resource = segments[0]?.toUpperCase() ?? 'UNKNOWN';
    const subAction = segments[2]?.toUpperCase();

    if (subAction) return `${subAction}_${resource.replace(/S$/, '')}`;

    const methodMap: Record<string, string> = {
      POST: `CREER_${resource.replace(/S$/, '')}`,
      PATCH: `MODIFIER_${resource.replace(/S$/, '')}`,
      PUT: `REMPLACER_${resource.replace(/S$/, '')}`,
      DELETE: `SUPPRIMER_${resource.replace(/S$/, '')}`,
    };
    return methodMap[method] ?? `ACTION_${resource}`;
  }
}
