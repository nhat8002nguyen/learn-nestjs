import { SetMetadata } from "@nestjs/common";

export const AUTH_TYPE = "AuthType";

export enum AuthType {
  None = "None",
  Jwt = "Jwt",
}

export const Auth = (type: AuthType) => SetMetadata(AUTH_TYPE, type);
