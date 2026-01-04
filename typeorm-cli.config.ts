import { Coffee } from "src/coffees/entities/coffee.entity";
import { Flavor } from "src/coffees/entities/flavor.entity";
import { SchemaSync1767260216900 } from "src/migrations/1767260216900-SchemaSync";
import { DataSource } from "typeorm";

export default new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "pass123",
  database: process.env.DB_DATABASE || "postgres",
  entities: [Coffee, Flavor],
  migrations: [SchemaSync1767260216900],
});
