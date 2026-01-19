import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CoffeesModule } from "src/coffees/coffees.module";
import { CreateCoffeeDto } from "src/coffees/dtos/create-coffee.dto";
import { App } from "supertest/types";
import request from "supertest";

describe("Coffees (e2e)", () => {
  let app: INestApplication<App>;
  let module: TestingModule;
  const coffee: CreateCoffeeDto = {
    name: "Test Coffee",
    brand: "Test Brand",
    flavors: ["Test Flavor 1", "Test Flavor 2"],
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        CoffeesModule,
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "localhost",
          port: 5433,
          username: "postgres",
          password: "pass123",
          database: "postgres",
          autoLoadEntities: true,
          synchronize: true,
        }),
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /coffees", () => {
    return request(app.getHttpServer())
      .post("/coffees")
      .send(coffee)
      .expect(HttpStatus.CREATED)
      .then((res) => {
        const body = res.body as {
          name: string;
          brand: string;
          flavors: Array<{ name: string }>;
        };
        expect(body.name).toBe(coffee.name);
        expect(body.brand).toBe(coffee.brand);
        expect(body.flavors).toBeDefined();
        expect(Array.isArray(body.flavors)).toBe(true);
        const flavorNames = body.flavors.map((f) => f.name);
        coffee.flavors.forEach((flavor) => {
          expect(flavorNames).toContain(flavor);
        });
      });
  });
});
