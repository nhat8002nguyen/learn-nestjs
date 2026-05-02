import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ServiceUnavailableException,
} from "@nestjs/common";
import { catchError, Observable, tap, throwError } from "rxjs";
import { CircuitBreaker } from "./circuit-breaker";

const DEFAULT_OPTIONS = {
  failureThreshold: 5,
  successThreshold: 5,
  retryAfterMs: 60 * 1000,
} as const;

type RouteHandler = (...args: unknown[]) => unknown;

@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  private readonly breakers = new Map<RouteHandler, CircuitBreaker>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler() as RouteHandler;
    const breaker = this.getOrCreateBreaker(handler);

    if (!breaker.allowRequest()) {
      const last = breaker.getLastError();
      if (last !== undefined) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw last;
      }
      throw new ServiceUnavailableException(
        "Circuit breaker is open. Please try again later.",
      );
    }

    return next.handle().pipe(
      tap(() => {
        breaker.onSuccess();
      }),
      catchError((err) => {
        breaker.onFailure(err);
        return throwError(() => err as unknown);
      }),
    );
  }

  private getOrCreateBreaker(handler: RouteHandler): CircuitBreaker {
    const existing = this.breakers.get(handler);
    if (existing) {
      return existing;
    }
    const created = new CircuitBreaker({ ...DEFAULT_OPTIONS });
    this.breakers.set(handler, created);
    return created;
  }
}
