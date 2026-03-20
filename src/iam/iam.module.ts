import { forwardRef, Module } from "@nestjs/common";
import { AuthenticationModule } from "./authentication/authentication.module";
import { BcryptService } from "./hashing/bcrypt/bcrypt.service";
import { HashingService } from "./hashing/hashing.service";

@Module({
  providers: [
    BcryptService,
    {
      provide: HashingService,
      useClass: BcryptService,
    },
  ],
  exports: [HashingService],
  imports: [forwardRef(() => AuthenticationModule)],
})
export class IamModule {}
