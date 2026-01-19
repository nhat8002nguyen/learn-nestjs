import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource, ObjectLiteral, Repository } from "typeorm";
import { COFFEE_BRANDS } from "./coffees.constants";
import coffeesConfig from "./config/coffees.config";
import { Coffee } from "./entities/coffee.entity";
import { Flavor } from "./entities/flavor.entity";
import { CoffeesService } from "./coffees.service";
import { NotFoundException } from "@nestjs/common";

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;
const createMockRepository = <
  T extends ObjectLiteral,
>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe("CoffeesService", () => {
  let service: CoffeesService;
  let coffeeRepository: MockRepository<Coffee>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoffeesService,
        {
          provide: getRepositoryToken(Coffee),
          useValue: createMockRepository<Coffee>(),
        },
        {
          provide: getRepositoryToken(Flavor),
          useValue: createMockRepository<Flavor>(),
        },
        {
          provide: DataSource,
          useValue: {},
        },
        {
          provide: COFFEE_BRANDS,
          useValue: [],
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: coffeesConfig.KEY,
          useValue: {
            foo: "bar",
          },
        },
      ],
    }).compile();

    service = module.get<CoffeesService>(CoffeesService);
    coffeeRepository = module.get<MockRepository<Coffee>>(
      getRepositoryToken(Coffee),
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
  describe("findOne", () => {
    it("should return coffee", async () => {
      const coffee = { id: 1, name: "Test Coffee" };
      coffeeRepository.findOne?.mockReturnValue(coffee);
      const result = await service.findOne(coffee.id.toString());
      expect(result).toEqual(coffee);
    });
    it("should throw an error if coffee is not found", async () => {
      coffeeRepository.findOne?.mockReturnValue(undefined);
      await expect(service.findOne("1")).rejects.toThrow(NotFoundException);
    });
  });
});
