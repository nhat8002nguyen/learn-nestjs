import { Injectable, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Event } from "src/events/entities/event.entity/event.entity";
import { COFFEE_BRANDS } from "./coffees.constants";
import { CoffeesController } from "./coffees.controller";
import { CoffeesService } from "./coffees.service";
import { Coffee } from "./entities/coffee.entity";
import { Flavor } from "./entities/flavor.entity";
import coffeesConfig from "./config/coffees.config";

class ConfigService {}
class DevelopmentCongfigService {}
class ProductionConfigService {}

@Injectable()
export class CoffeeBrandsFactory {
  async create() {
    // Do something
    console.log("waiting for database loading!");
    await new Promise((resolve) => setTimeout(resolve, 0));
    return ["Highlands", "Trung Nguyen"];
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Coffee, Flavor, Event]),
    ConfigModule.forFeature(coffeesConfig),
  ],
  controllers: [CoffeesController],
  providers: [
    CoffeesService,
    CoffeeBrandsFactory,
    {
      provide: COFFEE_BRANDS,
      useFactory: async (factory: CoffeeBrandsFactory) =>
        await factory.create(),
      inject: [CoffeeBrandsFactory],
    },
    {
      provide: ConfigService,
      useClass:
        process.env.NODE_ENV === "production"
          ? ProductionConfigService
          : DevelopmentCongfigService,
    },
  ],
  exports: [CoffeesService],
})
export class CoffeesModule {}
