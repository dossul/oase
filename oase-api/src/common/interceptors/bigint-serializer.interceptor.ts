import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { serializeBigIntDeep } from '../utils/bigint.util';

/**
 * Intercepteur global : convertit récursivement les BigInt en string
 * dans toutes les réponses JSON (évite les 500 « Do not know how to
 * serialize a BigInt » sur les endpoints retournant des entités Prisma
 * avec champs BigInt : anomalies, quotas, demandes, actes…).
 */
@Injectable()
export class BigIntSerializerInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => serializeBigIntDeep(data)));
  }
}
