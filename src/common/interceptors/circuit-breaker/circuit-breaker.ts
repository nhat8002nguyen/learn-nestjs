export const CIRCUIT_BREAKER_STATE = {
  CLOSED: "closed",
  OPEN: "open",
  HALF_OPEN: "half-open",
} as const;

export type CircuitBreakerState =
  (typeof CIRCUIT_BREAKER_STATE)[keyof typeof CIRCUIT_BREAKER_STATE];

interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  retryAfterMs: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CIRCUIT_BREAKER_STATE.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private openedAt: number | null = null;
  private lastError: unknown;

  constructor(private readonly options: CircuitBreakerOptions) {}

  allowRequest(now = Date.now()): boolean {
    if (this.state === CIRCUIT_BREAKER_STATE.CLOSED) {
      return true;
    }

    if (
      this.state === CIRCUIT_BREAKER_STATE.OPEN &&
      this.openedAt !== null &&
      now - this.openedAt >= this.options.retryAfterMs
    ) {
      this.state = CIRCUIT_BREAKER_STATE.HALF_OPEN;
      this.successCount = 0;
      return true;
    }

    return this.state === CIRCUIT_BREAKER_STATE.HALF_OPEN;
  }

  onSuccess(): void {
    if (this.state === CIRCUIT_BREAKER_STATE.CLOSED) {
      this.failureCount = 0;
      return;
    }

    if (this.state === CIRCUIT_BREAKER_STATE.HALF_OPEN) {
      this.successCount += 1;
      if (this.successCount >= this.options.successThreshold) {
        this.close();
      }
    }
  }

  onFailure(error: unknown, now = Date.now()): void {
    this.lastError = error;

    if (this.state === CIRCUIT_BREAKER_STATE.CLOSED) {
      this.failureCount += 1;
      if (this.failureCount >= this.options.failureThreshold) {
        this.open(now);
      }
      return;
    }

    this.open(now);
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getLastError(): unknown {
    return this.lastError;
  }

  private open(now: number): void {
    this.state = CIRCUIT_BREAKER_STATE.OPEN;
    this.openedAt = now;
    this.failureCount = 0;
    this.successCount = 0;
  }

  private close(): void {
    this.state = CIRCUIT_BREAKER_STATE.CLOSED;
    this.openedAt = null;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastError = undefined;
  }
}
