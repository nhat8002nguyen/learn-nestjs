import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { HashingService } from "src/iam/hashing/hashing.service";
import { GeneratedApiKeyPayload } from "../authentication.interface";

@Injectable()
export class ApiKeyService {
  constructor(private readonly hashingService: HashingService) {}

  async createAndHash(id: string): Promise<GeneratedApiKeyPayload> {
    const apiKey = this.generateApiKey(id);
    const hashedKey = await this.hashingService.hash(apiKey);
    return {
      apiKey,
      hashedKey,
    };
  }

  async validate(apiKey: string, hashedKey: string): Promise<boolean> {
    return this.hashingService.compare(apiKey, hashedKey);
  }

  extractIdFromApiKey(apiKey: string): string {
    const [id] = Buffer.from(apiKey, "base64").toString("utf-8").split(":");
    return id;
  }

  private generateApiKey(id: string): string {
    const payload = `${id}:${randomUUID()}`;
    return Buffer.from(payload).toString("base64");
  }
}
