import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@nestjs/common";
import { DiscoveryService, MetadataScanner } from "@nestjs/core";
import { Reflector } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { INTERVAL } from "../decorators/interval.decorator";

@Injectable()
export class IntervalSchedule
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly intervals: Map<string, NodeJS.Timeout> = new Map();
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly metadataScanner: MetadataScanner,
  ) {}
  onApplicationBootstrap() {
    const providers = this.discoveryService.getProviders();
    providers.forEach((provider: InstanceWrapper) => {
      const instance = provider.instance as object | undefined;
      if (typeof instance !== "object" || instance === null) return;
      const prototype = Object.getPrototypeOf(instance) as Record<
        string,
        unknown
      > | null;
      if (!prototype) return;
      const methods = this.metadataScanner.getAllMethodNames(
        prototype as object,
      );
      methods.forEach((method) => {
        const methodRef = prototype[method] as
          | ((this: object, ...args: never[]) => unknown)
          | undefined;
        if (typeof methodRef !== "function") return;

        const interval = this.reflector.get<number>(INTERVAL, methodRef);
        if (!interval) return;
        const timeout = setInterval(() => {
          methodRef.call(instance);
        }, interval);
        this.intervals.set(method, timeout);
      });
    });
  }

  onApplicationShutdown() {
    this.intervals.forEach((timeout) => clearInterval(timeout));
    this.intervals.clear();
  }
}
