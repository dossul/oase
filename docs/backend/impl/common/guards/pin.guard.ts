import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

/**
 * PinGuard — vérifie que `body.pin` est valide avant toute action de signature.
 * Utilisé sur : POST /demandes/:id/approuver, POST /workflow/etapes/:id/valider
 */
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
