import { forwardRef, Module } from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { CacheModule } from "src/cache/cache.module";
import { IamModule } from "src/iam/iam.module";
import { UsersModule } from "src/users/users.module";
import { AuthenticationController } from "./authentication.controller";
import { AuthenticationService } from "./authentication.service";
import jwtConfig from "./config/jwt.config";
import { JwtService } from "./jwt/jwt.service";
import { RefreshTokenStorage } from "./refresh-token-storage/refresh-token-storage.service";
import { AccessTokenGuard } from "./guards/access-token.guard";

@Module({
  imports: [
    forwardRef(() => IamModule),
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
  ],
  controllers: [AuthenticationController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    AuthenticationService,
    JwtService,
    RefreshTokenStorage,
  ],
})
export class AuthenticationModule {}
