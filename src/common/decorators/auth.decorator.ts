import { SetMetadata } from "@nestjs/common";

export const AUTH_TYPE = "AuthType";

export enum AuthType {
  None = "None",
  Jwt = "Jwt",
  ApiKey = "ApiKey",
}

export const Auth = (...types: AuthType[]) => SetMetadata(AUTH_TYPE, types);
