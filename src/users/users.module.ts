import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { ApiKey } from "./entities/api-key.entity";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [TypeOrmModule.forFeature([User, ApiKey])],
  exports: [UsersService],
})
export class UsersModule {}
