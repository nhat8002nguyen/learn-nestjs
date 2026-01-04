import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { PaginationQueryDto } from "src/common/dtos/pagination-query.dto.ts/pagination-query.dto";
import { CoffeesService } from "./coffees.service";
import { CreateCoffeeDto } from "./dtos/create-coffee.dto";
import { UpdateCoffeeDto } from "./dtos/update-coffee.dto";

@Controller("coffees")
export class CoffeesController {
  constructor(private readonly coffeesService: CoffeesService) {}

  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.coffeesService.findAll(paginationQuery);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.coffeesService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateCoffeeDto) {
    return this.coffeesService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateCoffeeDto) {
    return this.coffeesService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.coffeesService.remove(id);
  }
}
