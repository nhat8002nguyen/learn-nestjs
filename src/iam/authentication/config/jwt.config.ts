import { registerAs } from "@nestjs/config";

export default registerAs("jwt", () => ({
  secret: process.env.JWT_SECRET || "secret",
  accessTokenExpiresIn: Number(process.env.JWT_ACCESS_TOKEN_EXPIRATION) || 3600,
  refreshTokenExpiresIn:
    Number(process.env.JWT_REFRESH_TOKEN_EXPIRATION) || 86400,
}));
