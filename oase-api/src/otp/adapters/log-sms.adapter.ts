import { Injectable, Logger } from '@nestjs/common';
import { ISmsAdapter, SmsMessage } from './sms-adapter.interface';

/**
 * Adapter SMS par défaut : log en console (pino-pretty en dev).
 * En production, remplacer par un vrai provider via
 * `{ provide: SMS_ADAPTER, useClass: TwilioSmsAdapter }`.
 */
@Injectable()
export class LogSmsAdapter implements ISmsAdapter {
  private readonly logger = new Logger(LogSmsAdapter.name);

  async envoyer(message: SmsMessage): Promise<void> {
    // En dev on tronque pas le code, c'est nécessaire pour les tests manuels.
    // En prod, un vrai adapter n'enverra QUE par API SMS opérateur.
    this.logger.warn(
      `[MOCK SMS] to=${message.telephone} | ${message.corps.length} chars`,
    );
    this.logger.log(`[MOCK SMS BODY] ${message.corps}`);
  }
}
