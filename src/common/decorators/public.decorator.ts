import { applyDecorators, SetMetadata } from "@nestjs/common";

import { AuthType, AUTH_TYPE } from "./auth.decorator";

export const IS_API_PUBLIC = "IsPublic";

export const Public = () =>
  applyDecorators(
    SetMetadata(IS_API_PUBLIC, true),
    // Keep API key bypass and JWT bypass aligned for routes marked as "public".
    SetMetadata(AUTH_TYPE, [AuthType.None]),
  );
