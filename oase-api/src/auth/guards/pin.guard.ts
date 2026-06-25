import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class PinGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    const pin: string | undefined = req.body?.pin;

    if (!pin) {
      throw new UnauthorizedException({ code: 'PIN_REQUIS' });
    }

    const valid = await this.authService.verifyPin(user.id, pin);
    if (!valid) {
      throw new UnauthorizedException({ code: 'PIN_INVALIDE' });
    }

    return true;
  }
}
