import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/generated';

export type RoleCode = Role;

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleCode[]) => SetMetadata(ROLES_KEY, roles);
