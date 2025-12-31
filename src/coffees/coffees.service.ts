import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationQueryDto } from "src/common/dtos/pagination-query.dto.ts/pagination-query.dto";
import { Repository } from "typeorm";
import { CreateCoffeeDto } from "./dtos/create-coffee.dto";
import { UpdateCoffeeDto } from "./dtos/update-coffee.dto";
import { Coffee } from "./entities/coffee.entity";
import { Flavor } from "./entities/flavor.entity";

@Injectable()
export class CoffeesService {
  constructor(
    @InjectRepository(Coffee)
    private readonly coffeeRepository: Repository<Coffee>,

    @InjectRepository(Flavor)
    private readonly flavorRepository: Repository<Flavor>,
  ) {}

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

  async preloadFlavorByName(name: string): Promise<Flavor> {
    const flavor = await this.flavorRepository.findOne({ where: { name } });
    if (flavor) {
      return flavor;
    }

    return this.flavorRepository.create({ name });
  }
}
