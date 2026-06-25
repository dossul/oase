"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CircuitBreakerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerService = void 0;
const common_1 = require("@nestjs/common");
let CircuitBreakerService = CircuitBreakerService_1 = class CircuitBreakerService {
    constructor() {
        this.logger = new common_1.Logger(CircuitBreakerService_1.name);
        this.circuits = new Map();
        this.configs = new Map();
        this.defaults = {
            failureThreshold: 5,
            successThreshold: 2,
            timeout: 30_000,
            requestTimeout: 5_000,
        };
    }
    register(name, config) {
        this.configs.set(name, { ...this.defaults, ...config });
        this.circuits.set(name, {
            state: 'closed',
            failures: 0,
            successes: 0,
        });
    }
    getState(name) {
        return this.circuits.get(name)?.state ?? 'closed';
    }
    getStats(name) {
        return this.circuits.get(name);
    }
    async execute(name, fn, fallback) {
        if (!this.circuits.has(name))
            this.register(name);
        const stats = this.circuits.get(name);
        const cfg = this.configs.get(name);
        if (stats.state === 'open') {
            const elapsed = Date.now() - (stats.openedAt?.getTime() ?? 0);
            if (elapsed < cfg.timeout) {
                this.logger.warn(`[${name}] Circuit OUVERT — appel bloqué`);
                if (fallback)
                    return fallback();
                throw new Error(`Connecteur ${name} indisponible (circuit ouvert)`);
            }
            stats.state = 'half_open';
            stats.successes = 0;
            this.logger.log(`[${name}] Circuit HALF_OPEN — sondage`);
        }
        try {
            const result = await Promise.race([
                fn(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), cfg.requestTimeout)),
            ]);
            this.onSuccess(name, stats, cfg);
            return result;
        }
        catch (err) {
            this.onFailure(name, stats, cfg, err);
            if (fallback)
                return fallback();
            throw err;
        }
    }
    forceOpen(name) {
        const stats = this.circuits.get(name);
        if (stats) {
            stats.state = 'open';
            stats.openedAt = new Date();
            this.logger.warn(`[${name}] Circuit forcé OUVERT (maintenance)`);
        }
    }
    forceClose(name) {
        const stats = this.circuits.get(name);
        if (stats) {
            stats.state = 'closed';
            stats.failures = 0;
            stats.successes = 0;
            this.logger.log(`[${name}] Circuit forcé FERMÉ`);
        }
    }
    onSuccess(name, stats, cfg) {
        stats.lastSuccess = new Date();
        if (stats.state === 'half_open') {
            stats.successes++;
            if (stats.successes >= cfg.successThreshold) {
                stats.state = 'closed';
                stats.failures = 0;
                this.logger.log(`[${name}] Circuit FERMÉ (récupération confirmée)`);
            }
        }
        else {
            stats.failures = 0;
        }
    }
    onFailure(name, stats, cfg, err) {
        stats.lastFailure = new Date();
        stats.failures++;
        this.logger.error(`[${name}] Échec ${stats.failures}/${cfg.failureThreshold} : ${err}`);
        if (stats.state === 'half_open' || stats.failures >= cfg.failureThreshold) {
            stats.state = 'open';
            stats.openedAt = new Date();
            this.logger.error(`[${name}] Circuit OUVERT après ${stats.failures} échecs`);
        }
    }
};
exports.CircuitBreakerService = CircuitBreakerService;
exports.CircuitBreakerService = CircuitBreakerService = CircuitBreakerService_1 = __decorate([
    (0, common_1.Injectable)()
], CircuitBreakerService);
//# sourceMappingURL=circuit-breaker.service.js.map