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
import { ParseIntPipe } from "src/common/pipes/parse-int/parse-int.pipe";
import { Protocol } from "src/common/decorators/protocol.decorator";
import { Auth, AuthType } from "src/common/decorators/auth.decorator";
import { ApiForbiddenResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("coffees")
@Auth(AuthType.Jwt)
@Controller("coffees")
export class CoffeesController {
  constructor(private readonly coffeesService: CoffeesService) {}

  @ApiForbiddenResponse({ description: "Forbidden." })
  @Get()
  findAll(
    @Protocol("https") protocol: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    console.log("Actual protocol:", protocol);
    return this.coffeesService.findAll(paginationQuery);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: string) {
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
