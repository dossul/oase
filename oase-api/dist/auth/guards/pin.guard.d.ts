import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service';
export declare class PinGuard implements CanActivate {
    private authService;
    constructor(authService: AuthService);
    canActivate(ctx: ExecutionContext): Promise<boolean>;
}
