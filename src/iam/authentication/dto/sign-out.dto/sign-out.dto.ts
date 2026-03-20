import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SignOutDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refreshToken?: string;
}
