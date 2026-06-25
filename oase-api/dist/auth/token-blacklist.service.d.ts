export declare class TokenBlacklistService {
    private readonly blacklist;
    revoke(token: string): void;
    isRevoked(token: string): boolean;
}
