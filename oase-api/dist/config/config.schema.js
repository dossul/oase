"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
exports.configSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3000),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: zod_1.z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('change-me-in-production-oase-jwt-secret'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16).default('change-me-in-production-oase-refresh-secret'),
    JWT_ACCESS_EXPIRATION: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRATION: zod_1.z.string().default('7d'),
    ENCRYPTION_KEY: zod_1.z.string().min(16).default('change-me-in-production-encryption-key'),
});
function validate(config) {
    const parsed = exports.configSchema.safeParse(config);
    if (!parsed.success) {
        throw new Error(`Configuration validation error: ${parsed.error.message}`);
    }
    return parsed.data;
}
//# sourceMappingURL=config.schema.js.map