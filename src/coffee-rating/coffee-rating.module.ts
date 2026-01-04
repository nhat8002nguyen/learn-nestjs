import { Module } from "@nestjs/common";
import { CoffeeRatingService } from "./coffee-rating.service";
import { CoffeesModule } from "src/coffees/coffees.module";
import { DatabaseModule } from "src/database/database.module";

@Module({
  providers: [CoffeeRatingService],
  imports: [
    CoffeesModule,
    DatabaseModule.register({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "pass123",
      database: process.env.DB_DATABASE || "postgres",
    }),
  ],
})
export class CoffeeRatingModule {}
