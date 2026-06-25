export type CircuitState = 'closed' | 'open' | 'half_open';
export interface CircuitConfig {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    requestTimeout: number;
}
interface CircuitStats {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailure?: Date;
    lastSuccess?: Date;
    openedAt?: Date;
}
export declare class CircuitBreakerService {
    private readonly logger;
    private readonly circuits;
    private readonly configs;
    private readonly defaults;
    register(name: string, config?: Partial<CircuitConfig>): void;
    getState(name: string): CircuitState;
    getStats(name: string): CircuitStats | undefined;
    execute<T>(name: string, fn: () => Promise<T>, fallback?: () => T): Promise<T>;
    forceOpen(name: string): void;
    forceClose(name: string): void;
    private onSuccess;
    private onFailure;
}
export {};
