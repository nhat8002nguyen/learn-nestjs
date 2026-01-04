import { DynamicModule, Module } from "@nestjs/common";
import { DataSourceOptions, DataSource } from "typeorm";

@Module({})
export class DatabaseModule {
  static register(options: DataSourceOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: "CONNECTION",
          useValue: new DataSource(options).initialize(),
        },
      ],
    };
  }
}
