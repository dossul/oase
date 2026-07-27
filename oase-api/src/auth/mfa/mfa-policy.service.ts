import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MfaChannelAdapter, MfaChannel, MFA_CHANNEL_ADAPTERS } from './mfa-channel.interface';
import { createHash, randomBytes } from 'crypto';

export interface MfaConfig {
  enabled: boolean;
  channels: MfaChannel[];
  defaultChannel: MfaChannel;
  ttlSeconds: number;
  maxAttempts: number;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  whatsappTemplate: string;
}

const DEFAULT_CONFIG: MfaConfig = {
  enabled: false,
  channels: ['totp'],
  defaultChannel: 'totp',
  ttlSeconds: 300,
  maxAttempts: 5,
  emailEnabled: false,
  whatsappEnabled: false,
  whatsappTemplate: 'Votre code de vérification OASE est: {code}',
};

const CONFIG_KEY_MAP: Record<string, keyof MfaConfig> = {
  'mfa.enabled': 'enabled',
  'mfa.channels': 'channels',
  'mfa.default_channel': 'defaultChannel',
  'mfa.ttl_seconds': 'ttlSeconds',
  'mfa.max_attempts': 'maxAttempts',
  'mfa.email.enabled': 'emailEnabled',
  'mfa.whatsapp.enabled': 'whatsappEnabled',
  'mfa.whatsapp.template': 'whatsappTemplate',
};

@Injectable()
export class MfaPolicyService {
  private readonly logger = new Logger(MfaPolicyService.name);
  private cachedConfig: MfaConfig | null = null;

  constructor(
    private prisma: PrismaService,
    private cfg: ConfigService,
    @Inject(MFA_CHANNEL_ADAPTERS) private adapters: MfaChannelAdapter[],
  ) {}

  async getConfig(): Promise<MfaConfig> {
    if (this.cachedConfig) return this.cachedConfig;

    const rows = await this.prisma.systemConfig.findMany({
      where: { key: { startsWith: 'mfa.' } },
    });

    const config: MfaConfig = { ...DEFAULT_CONFIG };

    for (const row of rows) {
      const fieldName = CONFIG_KEY_MAP[row.key];
      if (!fieldName) continue;
      const value = row.value;
      if (fieldName === 'enabled' || fieldName === 'emailEnabled' || fieldName === 'whatsappEnabled') {
        (config as any)[fieldName] = value === 'true';
      } else if (fieldName === 'ttlSeconds' || fieldName === 'maxAttempts') {
        (config as any)[fieldName] = parseInt(value, 10);
      } else if (fieldName === 'channels') {
        (config as any)[fieldName] = JSON.parse(value) as MfaChannel[];
      } else {
        (config as any)[fieldName] = value;
      }
    }

    // Override with env var if set (takes precedence in dev)
    const envEnabled = this.cfg.get<string>('MFA_ENABLED');
    if (envEnabled !== undefined) {
      config.enabled = envEnabled === 'true';
    }

    this.cachedConfig = config;
    return config;
  }

  async updateConfig(updates: Partial<MfaConfig>): Promise<MfaConfig> {
    const current = await this.getConfig();
    const newConfig = { ...current, ...updates };

    const entries: { key: string; value: string }[] = [];
    if (updates.enabled !== undefined) {
      entries.push({ key: 'mfa.enabled', value: String(updates.enabled) });
    }
    if (updates.channels !== undefined) {
      entries.push({ key: 'mfa.channels', value: JSON.stringify(updates.channels) });
    }
    if (updates.defaultChannel !== undefined) {
      entries.push({ key: 'mfa.default_channel', value: updates.defaultChannel });
    }
    if (updates.ttlSeconds !== undefined) {
      entries.push({ key: 'mfa.ttl_seconds', value: String(updates.ttlSeconds) });
    }
    if (updates.maxAttempts !== undefined) {
      entries.push({ key: 'mfa.max_attempts', value: String(updates.maxAttempts) });
    }
    if (updates.emailEnabled !== undefined) {
      entries.push({ key: 'mfa.email.enabled', value: String(updates.emailEnabled) });
    }
    if (updates.whatsappEnabled !== undefined) {
      entries.push({ key: 'mfa.whatsapp.enabled', value: String(updates.whatsappEnabled) });
    }
    if (updates.whatsappTemplate !== undefined) {
      entries.push({ key: 'mfa.whatsapp.template', value: updates.whatsappTemplate });
    }

    for (const entry of entries) {
      await this.prisma.systemConfig.upsert({
        where: { key: entry.key },
        create: { key: entry.key, value: entry.value },
        update: { value: entry.value },
      });
    }

    this.cachedConfig = newConfig;
    this.logger.log(`MFA config updated: ${entries.map((e) => e.key).join(', ')}`);
    return newConfig;
  }

  async isMfaRequired(userRole: string, userMfaActive: boolean): Promise<boolean> {
    const config = await this.getConfig();
    if (!config.enabled) return false;
    return userMfaActive;
  }

  getAdapter(canal: MfaChannel): MfaChannelAdapter {
    const adapter = this.adapters.find((a) => a.canal === canal);
    if (!adapter) throw new Error(`No adapter found for MFA channel: ${canal}`);
    return adapter;
  }

  async sendChallenge(params: {
    utilisateurId: string;
    email: string;
    telephone: string | null;
    canal: MfaChannel;
    mfaSecretEnc?: string | null;
  }): Promise<{ envoye: boolean; canal: MfaChannel; expireDans: number; codeDev?: string }> {
    const config = await this.getConfig();
    const adapter = this.getAdapter(params.canal);

    if (params.canal === 'totp') {
      // TOTP: no code to send, user generates from app
      return { envoye: true, canal: 'totp', expireDans: config.ttlSeconds };
    }

    // For email/whatsapp: generate a code, store hash, send via adapter
    const code = this.generateCode(6);
    const sel = randomBytes(16).toString('hex');
    const codeHash = this.hashCode(code, sel);
    const expiresAt = new Date(Date.now() + config.ttlSeconds * 1000);

    await this.prisma.mfaChallenge.updateMany({
      where: { utilisateurId: params.utilisateurId, canal: params.canal, estUtilise: false },
      data: { estUtilise: true },
    });

    await this.prisma.mfaChallenge.create({
      data: {
        utilisateurId: params.utilisateurId,
        canal: params.canal,
        codeHash,
        sel,
        tentatives: 0,
        expiresAt,
        estUtilise: false,
      },
    });

    await adapter.sendCode({
      utilisateurId: params.utilisateurId,
      email: params.email,
      telephone: params.telephone,
      code,
      ttlSeconds: config.ttlSeconds,
    });

    const exposeCode = this.cfg.get<boolean>('OTP_EXPOSE_CODE_IN_RESPONSE', false);

    return {
      envoye: true,
      canal: params.canal,
      expireDans: config.ttlSeconds,
      ...(exposeCode ? { codeDev: code } : {}),
    };
  }

  async verifyChallenge(params: {
    utilisateurId: string;
    canal: MfaChannel;
    code: string;
    mfaSecretEnc?: string | null;
  }): Promise<boolean> {
    const config = await this.getConfig();

    if (params.canal === 'totp') {
      const adapter = this.getAdapter('totp');
      return adapter.verifyCode({
        utilisateurId: params.utilisateurId,
        code: params.code,
        storedSecret: params.mfaSecretEnc,
      });
    }

    // For email/whatsapp: verify against MfaChallenge table
    const challenge = await this.prisma.mfaChallenge.findFirst({
      where: {
        utilisateurId: params.utilisateurId,
        canal: params.canal,
        estUtilise: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) return false;

    if (challenge.expiresAt.getTime() < Date.now()) {
      await this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { estUtilise: true },
      });
      return false;
    }

    if (challenge.tentatives >= config.maxAttempts) {
      await this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { estUtilise: true },
      });
      return false;
    }

    const codeHash = this.hashCode(params.code, challenge.sel);
    if (codeHash !== challenge.codeHash) {
      await this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { tentatives: challenge.tentatives + 1 },
      });
      return false;
    }

    await this.prisma.mfaChallenge.update({
      where: { id: challenge.id },
      data: { estUtilise: true },
    });

    return true;
  }

  private generateCode(length: number): string {
    const max = 10 ** length;
    return Math.floor(Math.random() * max).toString().padStart(length, '0');
  }

  private hashCode(code: string, sel: string): string {
    return createHash('sha256').update(`${code}:${sel}`).digest('hex');
  }
}
