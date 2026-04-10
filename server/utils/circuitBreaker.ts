/**
 * Circuit Breaker — prevents hammering failed external APIs.
 *
 * After `failureThreshold` consecutive failures, the circuit "opens" and
 * all calls are short-circuited for `resetTimeoutMs` before allowing a
 * single probe request through ("half-open" state).
 */

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit (default: 3) */
  failureThreshold?: number;
  /** How long the circuit stays open before allowing a probe (default: 2 min) */
  resetTimeoutMs?: number;
  /** Name for logging purposes */
  name?: string;
}

type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly name: string;

  constructor(opts: CircuitBreakerOptions = {}) {
    this.failureThreshold = opts.failureThreshold ?? 3;
    this.resetTimeoutMs = opts.resetTimeoutMs ?? 2 * 60 * 1000; // 2 min
    this.name = opts.name ?? 'unknown';
  }

  /** Returns true if the request should be allowed through */
  canRequest(): boolean {
    if (this.state === 'closed') return true;

    if (this.state === 'open') {
      // Check if enough time has passed to allow a probe
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }

    // half-open — only one probe at a time (already allowed)
    return true;
  }

  /** Call after a successful response */
  onSuccess(): void {
    if (this.state !== 'closed') {
      console.log(`[CircuitBreaker:${this.name}] Circuit closed — service recovered`);
    }
    this.failures = 0;
    this.state = 'closed';
  }

  /** Call after a failed response */
  onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open' || this.failures >= this.failureThreshold) {
      this.state = 'open';
      console.warn(
        `[CircuitBreaker:${this.name}] Circuit OPEN — ${this.failures} failures, ` +
        `skipping for ${(this.resetTimeoutMs / 1000).toFixed(0)}s`
      );
    }
  }

  /** Execute a function with circuit breaker protection */
  async execute<T>(fn: () => Promise<T>, fallback?: T): Promise<T> {
    if (!this.canRequest()) {
      if (fallback !== undefined) return fallback;
      throw new Error(`[CircuitBreaker:${this.name}] Circuit is open — service temporarily unavailable`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /** Get current state for monitoring */
  getState(): { state: CircuitState; failures: number; name: string } {
    return { state: this.state, failures: this.failures, name: this.name };
  }
}

// ── Pre-configured breakers for academic APIs ──────────────────

export const academicBreakers = {
  semanticScholar: new CircuitBreaker({ name: 'SemanticScholar', failureThreshold: 3, resetTimeoutMs: 2 * 60 * 1000 }),
  openAlex: new CircuitBreaker({ name: 'OpenAlex', failureThreshold: 3, resetTimeoutMs: 2 * 60 * 1000 }),
  arxiv: new CircuitBreaker({ name: 'arXiv', failureThreshold: 3, resetTimeoutMs: 3 * 60 * 1000 }),
  crossref: new CircuitBreaker({ name: 'CrossRef', failureThreshold: 3, resetTimeoutMs: 2 * 60 * 1000 }),
  googleScholar: new CircuitBreaker({ name: 'GoogleScholar', failureThreshold: 2, resetTimeoutMs: 5 * 60 * 1000 }),
};
