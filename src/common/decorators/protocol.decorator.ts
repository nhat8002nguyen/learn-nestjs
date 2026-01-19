import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export const Protocol = createParamDecorator(
  (defaultValue: string, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();

    return request.protocol;
  },
);
