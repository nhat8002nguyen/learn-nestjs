import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import * as config from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationQueryDto } from "src/common/dtos/pagination-query.dto.ts/pagination-query.dto";
import { Event } from "src/events/entities/event.entity/event.entity";
import { DataSource, Repository } from "typeorm";
import { COFFEE_BRANDS } from "./coffees.constants";
import coffeesConfig from "./config/coffees.config";
import { CreateCoffeeDto } from "./dtos/create-coffee.dto";
import { UpdateCoffeeDto } from "./dtos/update-coffee.dto";
import { Coffee } from "./entities/coffee.entity";
import { Flavor } from "./entities/flavor.entity";

@Injectable({})
export class CoffeesService {
  constructor(
    @InjectRepository(Coffee)
    private readonly coffeeRepository: Repository<Coffee>,
    @InjectRepository(Flavor)
    private readonly flavorRepository: Repository<Flavor>,
    private readonly dataSource: DataSource,
    @Inject(COFFEE_BRANDS) coffeeBrands: string[],
    private readonly configService: config.ConfigService,
    @Inject(coffeesConfig.KEY)
    private readonly coffeesConfiguration: config.ConfigType<
      typeof coffeesConfig
    >,
  ) {
    console.log(coffeeBrands);
    console.log(
      "CoffeesService constructor - DB_HOST:",
      this.configService.get("database.host"),
    );
    console.log("CoffeesConfig: ", this.coffeesConfiguration.foo);
  }

  async findAll({ limit, offset }: PaginationQueryDto): Promise<Coffee[]> {
    return await this.coffeeRepository.find({
      relations: {
        flavors: true,
      },
      skip: offset,
      take: limit,
    });
  }

  async findOne(id: string): Promise<Coffee> {
    const exist = await this.coffeeRepository.findOne({
      where: { id: +id },
      relations: { flavors: true },
    });
    if (!exist) {
      throw new NotFoundException(`This coffee with id ${id} does not exist`);
    }

    return exist;
  }

  async create(payload: CreateCoffeeDto): Promise<Coffee> {
    const flavors = await Promise.all(
      payload.flavors.map((f) => this.preloadFlavorByName(f)),
    );
    const coffee = this.coffeeRepository.create({
      ...payload,
      flavors,
    });

    return await this.coffeeRepository.save(coffee);
  }

  async update(id: string, payload: UpdateCoffeeDto): Promise<Coffee> {
    const flavors =
      payload.flavors &&
      (await Promise.all(
        payload.flavors.map((f) => this.preloadFlavorByName(f)),
      ));
    const coffee = await this.coffeeRepository.preload({
      id: +id,
      ...payload,
      flavors,
    });

    if (!coffee) {
      throw new NotFoundException(`Coffee with id ${id} doesn't exist`);
    }
    const updated = await this.coffeeRepository.save(coffee);

    return updated;
  }

  async remove(id: string): Promise<Coffee> {
    const item = await this.findOne(id);

    return await this.coffeeRepository.remove(item);
  }

  async recommendCoffee(coffee: Coffee) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction();
    try {
      coffee.recommendations++;

      const recommendEvent = new Event();
      recommendEvent.name = "recommend_coffee";
      recommendEvent.type = "coffee";
      recommendEvent.payload = { coffeeId: coffee.id };

      await queryRunner.manager.save(coffee);
      await queryRunner.manager.save(recommendEvent);

      await queryRunner.commitTransaction();
    } catch (err) {
      console.error("recommend transaction failed", err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async preloadFlavorByName(name: string): Promise<Flavor> {
    const flavor = await this.flavorRepository.findOne({ where: { name } });
    if (flavor) {
      return flavor;
    }

    return this.flavorRepository.create({ name });
  }
}
