import { Module } from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { CacheModule } from "src/cache/cache.module";
import { UsersModule } from "src/users/users.module";
import { AuthenticationController } from "./authentication/authentication.controller";
import { AuthenticationService } from "./authentication/authentication.service";
import jwtConfig from "./authentication/config/jwt.config";
import { AccessTokenGuard } from "./authentication/guards/access-token.guard";
import { ApiKeyGuard } from "./authentication/guards/api-key/api-key.guard";
import { JwtService } from "./authentication/jwt/jwt.service";
import { RefreshTokenStorage } from "./authentication/refresh-token-storage/refresh-token-storage.service";
import { BcryptService } from "./hashing/bcrypt/bcrypt.service";
import { HashingService } from "./hashing/hashing.service";
import { RolesGuard } from "./authorization/guards/roles/roles.guard";
import { ApiKeyService } from "./authentication/api-key/api-key.service";
import { ApiKey } from "src/users/entities/api-key.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthenticationGuard } from "./authentication/guards/authentication/authentication.guard";

@Module({
  imports: [
    CacheModule,
    UsersModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      useFactory: (jwtConfiguration: ConfigType<typeof jwtConfig>) => ({
        secret: jwtConfiguration.secret,
      }),
      inject: [jwtConfig.KEY],
    }),
    TypeOrmModule.forFeature([ApiKey]),
  ],
  controllers: [AuthenticationController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AccessTokenGuard,
    ApiKeyGuard,
    AuthenticationGuard,
    BcryptService,
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    AuthenticationService,
    JwtService,
    RefreshTokenStorage,
    ApiKeyService,
  ],
  exports: [TypeOrmModule, HashingService, ApiKeyService],
})
export class IamModule {}
