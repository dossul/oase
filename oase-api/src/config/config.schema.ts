import { z } from 'zod';

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters')
    .default('change-me-in-production-oase-jwt-secret'),
  JWT_REFRESH_SECRET: z.string().min(16).default('change-me-in-production-oase-refresh-secret'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().min(16).default('change-me-in-production-encryption-key'),
  // OTP phone verification (Lot 2)
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(600),           // 10 min
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
  // DEV ONLY: include the OTP code in the /otp/request response (jamais en prod)
  OTP_EXPOSE_CODE_IN_RESPONSE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // SMTP pour l'envoi réel des codes MFA par e-mail (canal email).
  // Absentes en dev/test → l'adaptateur email retombe sur un log placeholder.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: z.enum(['true', 'false']).default('true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

export function validate(config: Record<string, unknown>) {
  const parsed = configSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Configuration validation error: ${parsed.error.message}`);
  }
  return parsed.data;
}
