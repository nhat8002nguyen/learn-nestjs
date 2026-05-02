import { CallHandler, ExecutionContext } from "@nestjs/common";
import { lastValueFrom, of, throwError } from "rxjs";
import { CircuitBreakerInterceptor } from "./circuit-breaker.interceptor";

function createContext(
  handler: (...args: unknown[]) => unknown,
): ExecutionContext {
  return { getHandler: () => handler } as unknown as ExecutionContext;
}

async function expectLastValueRejects(
  promise: ReturnType<CircuitBreakerInterceptor["intercept"]>,
  message: string,
): Promise<void> {
  let caught = false;
  try {
    await lastValueFrom(promise);
  } catch (e) {
    caught = true;
    expect(e).toBeInstanceOf(Error);
    expect((e as Error).message).toBe(message);
  }
  expect(caught).toBe(true);
}

describe("CircuitBreakerInterceptor", () => {
  let interceptor: CircuitBreakerInterceptor;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    interceptor = new CircuitBreakerInterceptor();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should be defined", () => {
    expect(new CircuitBreakerInterceptor()).toBeDefined();
  });

  it("should pass successful requests", async () => {
    const handlerRef = function routeOne() {};
    const ctx = createContext(handlerRef);
    const next: CallHandler = {
      handle: jest.fn(() => of("ok")),
    };

    const result = await lastValueFrom(interceptor.intercept(ctx, next));
    expect(result).toBe("ok");
  });

  it("should rethrow the same error reference while open", async () => {
    const handlerRef = function routeStoredErr() {};
    const ctx = createContext(handlerRef);
    const trippingError = new Error("tripped");
    const errors = [
      new Error("fail1"),
      new Error("fail2"),
      new Error("fail3"),
      trippingError,
    ];
    let i = 0;
    const failedHandler: CallHandler = {
      handle: jest.fn(() => throwError(() => errors[i++])),
    };

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expectLastValueRejects(
        interceptor.intercept(ctx, failedHandler),
        errors[attempt].message,
      );
    }

    let thrown: unknown;
    try {
      interceptor.intercept(ctx, failedHandler);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBe(trippingError);
  });

  it("should open the circuit after 4 failures and reject requests", async () => {
    const handlerRef = function routeTwo() {};
    const ctx = createContext(handlerRef);
    const failedHandler: CallHandler = {
      handle: jest.fn(() => throwError(() => new Error("request failed"))),
    };

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expectLastValueRejects(
        interceptor.intercept(ctx, failedHandler),
        "request failed",
      );
    }

    expect(() =>
      interceptor.intercept(ctx, failedHandler),
    ).toThrow("request failed");
  });

  it("should close the circuit after 60s and 4 successful half-open attempts", async () => {
    const handlerRef = function routeThree() {};
    const ctx = createContext(handlerRef);
    const failedHandler: CallHandler = {
      handle: jest.fn(() => throwError(() => new Error("request failed"))),
    };

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expectLastValueRejects(
        interceptor.intercept(ctx, failedHandler),
        "request failed",
      );
    }

    jest.setSystemTime(new Date("2026-01-01T00:01:00.000Z"));

    const successHandler: CallHandler = {
      handle: jest.fn(() => of("ok")),
    };

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const result = await lastValueFrom(
        interceptor.intercept(ctx, successHandler),
      );
      expect(result).toBe("ok");
    }

    const final = await lastValueFrom(
      interceptor.intercept(ctx, successHandler),
    );
    expect(final).toBe("ok");
  });

  it("should use a separate circuit breaker per handler", async () => {
    const trippedHandlerRef = function trippedRoute() {};
    const otherHandlerRef = function otherRoute() {};
    const ctxTripped = createContext(trippedHandlerRef);
    const ctxOther = createContext(otherHandlerRef);

    const failedHandler: CallHandler = {
      handle: jest.fn(() => throwError(() => new Error("request failed"))),
    };
    const successHandler: CallHandler = {
      handle: jest.fn(() => of("ok")),
    };

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expectLastValueRejects(
        interceptor.intercept(ctxTripped, failedHandler),
        "request failed",
      );
    }

    expect(() =>
      interceptor.intercept(ctxTripped, failedHandler),
    ).toThrow("request failed");

    const otherResult = await lastValueFrom(
      interceptor.intercept(ctxOther, successHandler),
    );
    expect(otherResult).toBe("ok");
  });

  it("should re-open from half-open on failure and reset the retry window", async () => {
    const handlerRef = function flakyRoute() {};
    const ctx = createContext(handlerRef);
    const failedHandler: CallHandler = {
      handle: jest.fn(() => throwError(() => new Error("request failed"))),
    };
    const successHandler: CallHandler = {
      handle: jest.fn(() => of("ok")),
    };

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expectLastValueRejects(
        interceptor.intercept(ctx, failedHandler),
        "request failed",
      );
    }

    jest.setSystemTime(new Date("2026-01-01T00:01:00.000Z"));

    let result = await lastValueFrom(
      interceptor.intercept(ctx, successHandler),
    );
    expect(result).toBe("ok");
    result = await lastValueFrom(interceptor.intercept(ctx, successHandler));
    expect(result).toBe("ok");

    await expectLastValueRejects(
      interceptor.intercept(ctx, failedHandler),
      "request failed",
    );

    expect(() =>
      interceptor.intercept(ctx, successHandler),
    ).toThrow("request failed");

    jest.setSystemTime(new Date("2026-01-01T00:01:30.000Z"));
    expect(() =>
      interceptor.intercept(ctx, successHandler),
    ).toThrow("request failed");

    jest.setSystemTime(new Date("2026-01-01T00:02:01.000Z"));
    result = await lastValueFrom(interceptor.intercept(ctx, successHandler));
    expect(result).toBe("ok");
  });
});
