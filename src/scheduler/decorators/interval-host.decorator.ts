import { SetMetadata } from "@nestjs/common";

export const INTERVAL_HOST = "IntervalHost";

export const IntervalHost = () => SetMetadata(INTERVAL_HOST, true);
