import { UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { UsersService } from "src/users/users.service";
import { HashingService } from "../hashing/hashing.service";
import { AuthenticationService } from "./authentication.service";
import { JwtService } from "./jwt/jwt.service";
import { RefreshTokenStorage } from "./refresh-token-storage/refresh-token-storage.service";

describe("AuthenticationService", () => {
  let service: AuthenticationService;
  let usersService: jest.Mocked<
    Pick<UsersService, "findOneByEmail" | "findOne" | "create">
  >;
  let hashingService: jest.Mocked<Pick<HashingService, "compare" | "hash">>;
  let jwtService: jest.Mocked<
    Pick<
      JwtService,
      "signAccessToken" | "signRefreshToken" | "verifyRefreshToken"
    >
  >;
  let refreshTokenStorage: jest.Mocked<
    Pick<RefreshTokenStorage, "save" | "validateAndConsume" | "revoke">
  >;

  beforeEach(async () => {
    usersService = {
      findOneByEmail: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    };
    hashingService = {
      compare: jest.fn(),
      hash: jest.fn(),
    };
    jwtService = {
      signAccessToken: jest.fn().mockResolvedValue("access"),
      signRefreshToken: jest.fn().mockResolvedValue("refresh"),
      verifyRefreshToken: jest.fn(),
    };
    refreshTokenStorage = {
      save: jest.fn().mockResolvedValue(undefined),
      validateAndConsume: jest.fn(),
      revoke: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: UsersService, useValue: usersService },
        { provide: HashingService, useValue: hashingService },
        { provide: JwtService, useValue: jwtService },
        { provide: RefreshTokenStorage, useValue: refreshTokenStorage },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("signIn", () => {
    it("persists refresh id, returns tokens and public user on success", async () => {
      const user = { id: 1, email: "u@test.com", password: "hash" };
      usersService.findOneByEmail.mockResolvedValue(user);
      hashingService.compare.mockResolvedValue(true);

      const result = await service.signIn({
        email: "u@test.com",
        password: "secret",
      });

      expect(refreshTokenStorage.save).toHaveBeenCalledWith(
        expect.any(String),
        1,
      );
      expect(jwtService.signRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 1,
          tokenType: "refresh",
          jti: expect.any(String),
        }),
      );
      expect(result).toEqual({
        user: { id: 1, email: "u@test.com" },
        accessToken: "access",
        refreshToken: "refresh",
      });
    });

    it("throws when user missing", async () => {
      usersService.findOneByEmail.mockResolvedValue(null);
      await expect(
        service.signIn({ email: "x@test.com", password: "p" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("throws when password invalid", async () => {
      usersService.findOneByEmail.mockResolvedValue({
        id: 1,
        email: "u@test.com",
        password: "hash",
      });
      hashingService.compare.mockResolvedValue(false);
      await expect(
        service.signIn({ email: "u@test.com", password: "wrong" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("refreshTokens", () => {
    it("rotates tokens when refresh id is valid", async () => {
      jwtService.verifyRefreshToken.mockResolvedValue({
        sub: 1,
        tokenType: "refresh",
        jti: "old-jti",
      });
      refreshTokenStorage.validateAndConsume.mockResolvedValue(1);
      usersService.findOne.mockResolvedValue({
        id: 1,
        email: "u@test.com",
        password: "h",
      });

      const result = await service.refreshTokens("raw-refresh");

      expect(refreshTokenStorage.validateAndConsume).toHaveBeenCalledWith(
        "old-jti",
      );
      expect(refreshTokenStorage.save).toHaveBeenCalledWith(
        expect.any(String),
        1,
      );
      expect(result).toEqual({
        user: { id: 1, email: "u@test.com" },
        accessToken: "access",
        refreshToken: "refresh",
      });
    });

    it("throws when JWT verification fails", async () => {
      jwtService.verifyRefreshToken.mockRejectedValue(new Error("bad"));
      await expect(service.refreshTokens("x")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("throws when redis no longer has refresh id", async () => {
      jwtService.verifyRefreshToken.mockResolvedValue({
        sub: 1,
        tokenType: "refresh",
        jti: "gone",
      });
      refreshTokenStorage.validateAndConsume.mockResolvedValue(null);
      await expect(service.refreshTokens("x")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe("signUp", () => {
    it("hashes password and creates user", async () => {
      const dto: CreateUserDto = { email: "n@test.com", password: "plain" };
      hashingService.hash.mockResolvedValue("hashed");
      usersService.create.mockResolvedValue({
        id: 2,
        email: dto.email,
        password: "hashed",
      });

      const created = await service.signUp(dto);

      expect(hashingService.hash).toHaveBeenCalledWith("plain");
      expect(usersService.create).toHaveBeenCalledWith({
        ...dto,
        password: "hashed",
      });
      expect(created).toEqual({
        id: 2,
        email: dto.email,
        password: "hashed",
      });
    });
  });

  describe("signOut", () => {
    it("revokes refresh id when token verifies", async () => {
      jwtService.verifyRefreshToken.mockResolvedValue({
        sub: 1,
        tokenType: "refresh",
        jti: "jti-1",
      });
      await service.signOut("refresh-jwt");
      expect(refreshTokenStorage.revoke).toHaveBeenCalledWith("jti-1");
    });

    it("ignores invalid refresh token", async () => {
      jwtService.verifyRefreshToken.mockRejectedValue(new Error("expired"));
      await expect(service.signOut("bad")).resolves.toBeUndefined();
      expect(refreshTokenStorage.revoke).not.toHaveBeenCalled();
    });
  });
});
