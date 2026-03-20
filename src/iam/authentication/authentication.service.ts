import { Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { UsersService } from "src/users/users.service";
import { HashingService } from "../hashing/hashing.service";
import { JwtService, type RefreshTokenPayload } from "./jwt/jwt.service";
import { RefreshTokenStorage } from "./refresh-token-storage/refresh-token-storage.service";
import { SignInDto } from "./dto/sign-in.dto/sign-in.dto";

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenStorage: RefreshTokenStorage,
  ) {}

  async signIn(signInDto: SignInDto) {
    const user = await this.usersService.findOneByEmail(signInDto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const isPasswordValid = await this.hashingService.compare(
      signInDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const refreshTokenId = randomUUID();
    await this.refreshTokenStorage.save(refreshTokenId, user.id);
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAccessToken({ sub: user.id, email: user.email }),
      this.jwtService.signRefreshToken({
        sub: user.id,
        tokenType: "refresh",
        jti: refreshTokenId,
      }),
    ]);
    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (payload.tokenType !== "refresh" || !payload.jti) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const userId = await this.refreshTokenStorage.validateAndConsume(
      payload.jti,
    );
    if (userId === null || userId !== payload.sub) {
      throw new UnauthorizedException("Refresh token is no longer valid");
    }
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }
    const newRefreshTokenId = randomUUID();
    await this.refreshTokenStorage.save(newRefreshTokenId, user.id);
    const [accessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAccessToken({ sub: user.id, email: user.email }),
      this.jwtService.signRefreshToken({
        sub: user.id,
        tokenType: "refresh",
        jti: newRefreshTokenId,
      }),
    ]);
    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async signOut(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }
    try {
      const payload = await this.jwtService.verifyRefreshToken(refreshToken);
      if (payload.jti) {
        await this.refreshTokenStorage.revoke(payload.jti);
      }
    } catch {
      // Ignore invalid or expired tokens on sign-out.
    }
  }

  async signUp(signUpDto: CreateUserDto) {
    const passwordHash = await this.hashingService.hash(signUpDto.password);
    const newUser = await this.usersService.create({
      ...signUpDto,
      password: passwordHash,
    });
    return newUser;
  }
}
