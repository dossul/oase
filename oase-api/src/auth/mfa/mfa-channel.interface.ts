export type MfaChannel = 'totp' | 'email' | 'whatsapp';

export interface MfaSendResult {
  envoye: boolean;
  canal: MfaChannel;
  expireDans: number;
  codeDev?: string;
}

export interface MfaChannelAdapter {
  readonly canal: MfaChannel;

  sendCode(params: {
    utilisateurId: string;
    email: string;
    telephone: string | null;
    code: string;
    ttlSeconds: number;
  }): Promise<void>;

  verifyCode(params: {
    utilisateurId: string;
    code: string;
    storedSecret?: string | null;
  }): Promise<boolean>;
}

export const MFA_CHANNEL_ADAPTERS = 'MFA_CHANNEL_ADAPTERS';
