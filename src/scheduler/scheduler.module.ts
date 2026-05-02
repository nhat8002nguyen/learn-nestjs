import { Module } from "@nestjs/common";
import { CronService } from "./cron/cron.service";
import { DiscoveryModule } from "@nestjs/core";
import { IntervalSchedule } from "./interval.schedule/interval.schedule";

@Module({
  imports: [DiscoveryModule],
  providers: [CronService, IntervalSchedule],
})
export class SchedulerModule {}
