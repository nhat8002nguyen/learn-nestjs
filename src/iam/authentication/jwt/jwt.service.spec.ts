import { JwtService as NestJwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import jwtConfig from "../config/jwt.config";
import { JwtService } from "./jwt.service";

describe("JwtService", () => {
  let service: JwtService;
  const nestJwt = {
    signAsync: jest.fn().mockResolvedValue("signed-token"),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    nestJwt.signAsync.mockClear();
    nestJwt.signAsync.mockResolvedValue("signed-token");
    nestJwt.verifyAsync.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        { provide: NestJwtService, useValue: nestJwt },
        {
          provide: jwtConfig.KEY,
          useValue: {
            secret: "test-secret",
            accessTokenExpiresIn: 3600,
            refreshTokenExpiresIn: 86400,
          },
        },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("signAccessToken delegates to Nest JwtService with access expiry", async () => {
    await service.signAccessToken({ sub: 1, email: "a@b.c" });
    expect(nestJwt.signAsync).toHaveBeenCalledWith(
      { sub: 1, email: "a@b.c" },
      { expiresIn: 3600 },
    );
  });

  it("signRefreshToken delegates to Nest JwtService with refresh expiry", async () => {
    await service.signRefreshToken({
      sub: 1,
      tokenType: "refresh",
      jti: "rt-id",
    });
    expect(nestJwt.signAsync).toHaveBeenCalledWith(
      { sub: 1, tokenType: "refresh", jti: "rt-id" },
      { expiresIn: 86400 },
    );
  });

  it("verifyRefreshToken delegates to Nest JwtService", async () => {
    nestJwt.verifyAsync.mockResolvedValue({ sub: 1, jti: "x" });
    await service.verifyRefreshToken("tok");
    expect(nestJwt.verifyAsync).toHaveBeenCalledWith("tok");
  });
});
