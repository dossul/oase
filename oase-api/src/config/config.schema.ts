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
});

export type Config = z.infer<typeof configSchema>;

export function validate(config: Record<string, unknown>) {
  const parsed = configSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Configuration validation error: ${parsed.error.message}`);
  }
  return parsed.data;
}
