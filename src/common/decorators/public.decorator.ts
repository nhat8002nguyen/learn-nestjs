import { SetMetadata } from "@nestjs/common";

export const IS_API_PUBLIC = "IsPublic";

export const Public = () => SetMetadata(IS_API_PUBLIC, true);
