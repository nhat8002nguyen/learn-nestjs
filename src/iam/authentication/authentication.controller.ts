import {
  Body,
  Controller,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { AuthenticationService } from "./authentication.service";
import { RefreshTokensDto } from "./dto/refresh-tokens.dto/refresh-tokens.dto";
import { SignInDto } from "./dto/sign-in.dto/sign-in.dto";
import { SignOutDto } from "./dto/sign-out.dto/sign-out.dto";
import { Public } from "src/common/decorators/public.decorator";

@Controller("authentication")
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Public()
  @Post("sign-in")
  signIn(@Body() signInDto: SignInDto) {
    return this.authenticationService.signIn(signInDto);
  }

  @Public()
  @Post("refresh-tokens")
  refreshTokens(@Body() dto: RefreshTokensDto) {
    return this.authenticationService.refreshTokens(dto.refreshToken);
  }

  @Public()
  @Post("sign-up")
  signUp(@Body() signUpDto: CreateUserDto) {
    return this.authenticationService.signUp(signUpDto);
  }

  @Public()
  @Post("sign-out")
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(@Body(new DefaultValuePipe({})) body: SignOutDto) {
    await this.authenticationService.signOut(body.refreshToken);
  }
}
