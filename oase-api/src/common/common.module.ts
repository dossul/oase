import { Global, Module } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RbacGuard } from './guards/rbac.guard';
import { ScopeGuard } from './guards/scope.guard';
import { ScopeService } from './services/scope.service';

@Global()
@Module({
  providers: [JwtAuthGuard, RbacGuard, ScopeGuard, ScopeService],
  exports: [JwtAuthGuard, RbacGuard, ScopeGuard, ScopeService],
})
export class CommonModule {}
