import { Injectable } from "@nestjs/common";
import { IntervalHost } from "../decorators/interval-host.decorator";

@IntervalHost()
@Injectable()
export class CronService {
  //@Interval(1000)
  handleInterval() {
    console.log("CronService handleInterval");
  }
}
