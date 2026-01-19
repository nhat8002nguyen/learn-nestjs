import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateCoffeeDto {
  @ApiProperty({ description: "The name of the coffee " })
  @IsString()
  name: string;

  @ApiProperty({ description: "The name of the coffee " })
  @IsString()
  brand: string;

  @ApiProperty({ example: ["vanila", "matcha"] })
  @IsString({ each: true })
  flavors: string[];
}
