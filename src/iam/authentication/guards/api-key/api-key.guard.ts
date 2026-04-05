import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { ApiKeyService } from "../../api-key/api-key.service";
import { ActiveUserData } from "../../dto/active-user-data/active-user-data.dto";
import { Repository } from "typeorm";
import { ApiKey } from "src/users/entities/api-key.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const apiKey = request.headers["api_key"] as string;
    if (!apiKey) {
      throw new UnauthorizedException("Missing API key");
    }

    const apiKeyId = this.apiKeyService.extractIdFromApiKey(apiKey);
    if (!apiKeyId) {
      throw new UnauthorizedException("Invalid API key");
    }

    try {
      const apiKeyEntity = await this.apiKeyRepository.findOne({
        where: {
          uuid: apiKeyId,
        },
        relations: {
          user: true,
        },
      });
      if (!apiKeyEntity) {
        throw new UnauthorizedException("Invalid API key");
      }
      const isValid = await this.apiKeyService.validate(
        apiKey,
        apiKeyEntity.key,
      );
      if (!isValid) {
        throw new UnauthorizedException("Invalid API key");
      }
      request["user"] = {
        sub: apiKeyEntity.userId,
        role: apiKeyEntity.user.role,
        email: apiKeyEntity.user.email,
      } as ActiveUserData;
    } catch {
      throw new UnauthorizedException("Invalid API key");
    }
    return true;
  }
}
