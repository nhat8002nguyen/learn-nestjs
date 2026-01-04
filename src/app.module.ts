import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CoffeeRatingModule } from "./coffee-rating/coffee-rating.module";
import { CoffeesModule } from "./coffees/coffees.module";
import { DatabaseModule } from "./database/database.module";
import Joi from "joi";
import appConfig from "./config/app.config";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: "postgres",
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== "production",
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
      validationSchema: Joi.object({
        DB_HOST: Joi.required(),
        DB_PORT: Joi.number().default(5432),
      }),
      load: [appConfig],
    }),
    CoffeesModule,
    CoffeeRatingModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
