import { ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard } from './rbac.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/generated';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RbacGuard(reflector);
  });

  const createContext = (user: any, handler: any, controller: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => handler,
      getClass: () => controller,
    }) as ExecutionContext;

  it('autorise si aucun role requis', () => {
    class TestController {}
    const handler = jest.fn();
    const ctx = createContext({ role: Role.BENEFICIAIRE }, handler, TestController);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('autorise si le role de l utilisateur est dans la liste', () => {
    class TestController {}
    const handler = jest.fn();
    SetMetadata(ROLES_KEY, [Role.AGENT_CI, Role.AGENT_CDDI])(handler);
    const ctx = createContext({ role: Role.AGENT_CI }, handler, TestController);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejette si le role n est pas autorise', () => {
    class TestController {}
    const handler = jest.fn();
    SetMetadata(ROLES_KEY, [Role.ADMIN_SI])(handler);
    const ctx = createContext({ role: Role.BENEFICIAIRE }, handler, TestController);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
