import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class MfaService {
  private readonly algorithm = 'aes-256-gcm';

  constructor(private cfg: ConfigService) {}

  generateSecret(): { secret: string; otpauthUrl: string } {
    const secret = authenticator.generateSecret(32);
    const otpauthUrl = authenticator.keyuri('', 'OASE MEF Togo', secret);
    return { secret, otpauthUrl };
  }

  async verifyTotp(encryptedSecret: string, token: string): Promise<boolean> {
    try {
      const secret = this.decrypt(encryptedSecret);
      authenticator.options = { window: 1 }; // ±30s tolérance
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }

  encrypt(plaintext: string): string {
    const key = Buffer.from(
      this.cfg.getOrThrow<string>('ENCRYPTION_KEY').padEnd(32).slice(0, 32),
    );
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':');
  }

  decrypt(ciphertext: string): string {
    const key = Buffer.from(
      this.cfg.getOrThrow<string>('ENCRYPTION_KEY').padEnd(32).slice(0, 32),
    );
    const [ivHex, tagHex, dataHex] = ciphertext.split(':');
    const decipher = createDecipheriv(this.algorithm, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(dataHex, 'hex')).toString('utf8') +
      decipher.final('utf8');
  }
}
