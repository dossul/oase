/**
 * Abstraction d'envoi SMS.
 * Permet de basculer entre LogSmsAdapter (dev) et un vrai provider
 * (Twilio, Orange SMS API, etc.) sans toucher au OtpService.
 */
export interface SmsMessage {
  /** Numéro au format E.164 : +22890123456 */
  telephone: string;
  /** Corps du SMS (160 chars conseillés, on n'envoie pas plus). */
  corps: string;
}

export interface ISmsAdapter {
  envoyer(message: SmsMessage): Promise<void>;
}

export const SMS_ADAPTER = Symbol('SMS_ADAPTER');
