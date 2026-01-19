import { Test, TestingModule } from "@nestjs/testing";
import { CoffeesController } from "./coffees.controller";
import { CoffeesService } from "./coffees.service";

describe("CoffeesController", () => {
  let controller: CoffeesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CoffeesService,
          useValue: {},
        },
      ],
      controllers: [CoffeesController],
    }).compile();

    controller = module.get<CoffeesController>(CoffeesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
