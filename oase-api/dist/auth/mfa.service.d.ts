import { ConfigService } from '@nestjs/config';
export declare class MfaService {
    private cfg;
    private readonly algorithm;
    constructor(cfg: ConfigService);
    generateSecret(): {
        secret: string;
        otpauthUrl: string;
    };
    verifyTotp(encryptedSecret: string, token: string): Promise<boolean>;
    encrypt(plaintext: string): string;
    decrypt(ciphertext: string): string;
}
