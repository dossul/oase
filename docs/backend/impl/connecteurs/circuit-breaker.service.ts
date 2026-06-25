import { Injectable, Logger } from '@nestjs/common';

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitConfig {
  failureThreshold: number;   // nb erreurs consécutives avant ouverture
  successThreshold: number;   // nb succès en half_open avant fermeture
  timeout: number;            // ms avant de passer de open → half_open
  requestTimeout: number;     // ms max par requête
}

interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  openedAt?: Date;
}

/**
 * CircuitBreakerService — implémentation générique du pattern Circuit Breaker.
 *
 * États :
 *  CLOSED     → appels normaux, comptage des échecs
 *  OPEN       → appels bloqués immédiatement, retourne fallback
 *  HALF_OPEN  → un appel de test autorisé pour sonder la récupération
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitStats>();
  private readonly configs = new Map<string, CircuitConfig>();

  private readonly defaults: CircuitConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30_000,
    requestTimeout: 5_000,
  };

  register(name: string, config?: Partial<CircuitConfig>): void {
    this.configs.set(name, { ...this.defaults, ...config });
    this.circuits.set(name, {
      state: 'closed',
      failures: 0,
      successes: 0,
    });
  }

  getState(name: string): CircuitState {
    return this.circuits.get(name)?.state ?? 'closed';
  }

  getStats(name: string): CircuitStats | undefined {
    return this.circuits.get(name);
  }

  async execute<T>(
    name: string,
    fn: () => Promise<T>,
    fallback?: () => T,
  ): Promise<T> {
    if (!this.circuits.has(name)) this.register(name);

    const stats = this.circuits.get(name)!;
    const cfg = this.configs.get(name)!;

    // ── OPEN → vérifier si le timeout est écoulé ──────────────
    if (stats.state === 'open') {
      const elapsed = Date.now() - (stats.openedAt?.getTime() ?? 0);
      if (elapsed < cfg.timeout) {
        this.logger.warn(`[${name}] Circuit OUVERT — appel bloqué`);
        if (fallback) return fallback();
        throw new Error(`Connecteur ${name} indisponible (circuit ouvert)`);
      }
      stats.state = 'half_open';
      stats.successes = 0;
      this.logger.log(`[${name}] Circuit HALF_OPEN — sondage`);
    }

    // ── CLOSED / HALF_OPEN → tentative d'appel ────────────────
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), cfg.requestTimeout),
        ),
      ]);

      this.onSuccess(name, stats, cfg);
      return result;
    } catch (err) {
      this.onFailure(name, stats, cfg, err);
      if (fallback) return fallback();
      throw err;
    }
  }

  forceOpen(name: string): void {
    const stats = this.circuits.get(name);
    if (stats) {
      stats.state = 'open';
      stats.openedAt = new Date();
      this.logger.warn(`[${name}] Circuit forcé OUVERT (maintenance)`);
    }
  }

  forceClose(name: string): void {
    const stats = this.circuits.get(name);
    if (stats) {
      stats.state = 'closed';
      stats.failures = 0;
      stats.successes = 0;
      this.logger.log(`[${name}] Circuit forcé FERMÉ`);
    }
  }

  private onSuccess(name: string, stats: CircuitStats, cfg: CircuitConfig): void {
    stats.lastSuccess = new Date();
    if (stats.state === 'half_open') {
      stats.successes++;
      if (stats.successes >= cfg.successThreshold) {
        stats.state = 'closed';
        stats.failures = 0;
        this.logger.log(`[${name}] Circuit FERMÉ (récupération confirmée)`);
      }
    } else {
      stats.failures = 0;
    }
  }

  private onFailure(name: string, stats: CircuitStats, cfg: CircuitConfig, err: unknown): void {
    stats.lastFailure = new Date();
    stats.failures++;
    this.logger.error(`[${name}] Échec ${stats.failures}/${cfg.failureThreshold} : ${err}`);

    if (stats.state === 'half_open' || stats.failures >= cfg.failureThreshold) {
      stats.state = 'open';
      stats.openedAt = new Date();
      this.logger.error(`[${name}] Circuit OUVERT après ${stats.failures} échecs`);
    }
  }
}
