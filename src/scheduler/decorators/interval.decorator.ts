import { SetMetadata } from "@nestjs/common";

export const INTERVAL = "Interval";

export const Interval = (ms: number) => SetMetadata(INTERVAL, ms);
