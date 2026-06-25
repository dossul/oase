import { z } from 'zod';
export declare const configSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    DATABASE_URL: z.ZodString;
    JWT_SECRET: z.ZodDefault<z.ZodString>;
    JWT_REFRESH_SECRET: z.ZodDefault<z.ZodString>;
    JWT_ACCESS_EXPIRATION: z.ZodDefault<z.ZodString>;
    JWT_REFRESH_EXPIRATION: z.ZodDefault<z.ZodString>;
    ENCRYPTION_KEY: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRATION: string;
    JWT_REFRESH_EXPIRATION: string;
    ENCRYPTION_KEY: string;
}, {
    DATABASE_URL: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: number | undefined;
    JWT_SECRET?: string | undefined;
    JWT_REFRESH_SECRET?: string | undefined;
    JWT_ACCESS_EXPIRATION?: string | undefined;
    JWT_REFRESH_EXPIRATION?: string | undefined;
    ENCRYPTION_KEY?: string | undefined;
}>;
export type Config = z.infer<typeof configSchema>;
export declare function validate(config: Record<string, unknown>): {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRATION: string;
    JWT_REFRESH_EXPIRATION: string;
    ENCRYPTION_KEY: string;
};
