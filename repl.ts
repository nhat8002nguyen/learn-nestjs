import * as repl from "node:repl";
import * as bcrypt from "bcrypt";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UsersService } from "./src/users/users.service";
import { UsersModule } from "./src/users/users.module";
import type { UpdateUserDto } from "./src/users/dto/update-user.dto";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IamModule } from "./src/iam/iam.module";
import { ApiKeyService } from "./src/iam/authentication/api-key/api-key.service";
import { ApiKey } from "./src/users/entities/api-key.entity";

type UserUpdatePatch = Pick<UpdateUserDto, "email" | "password">;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in your shell or create a .env file (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE).`,
    );
  }
  return value;
}

async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(plain, salt);
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        // Values are required by `requireEnv()` in `start()`.
        return {
          type: "postgres",
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV !== "production",
        };
      },
    }),
    UsersModule,
    IamModule,
  ],
})
class ReplModule {}

async function start() {
  const app = await NestFactory.createApplicationContext(ReplModule, {
    logger: ["error", "warn"],
  });
  await app.init();
  // Fail fast with a clear error if DB config is missing.
  requireEnv("DB_HOST");
  requireEnv("DB_PORT");
  requireEnv("DB_USERNAME");
  requireEnv("DB_PASSWORD");
  requireEnv("DB_DATABASE");

  const usersService = app.get(UsersService);
  const apiKeyService = app.get(ApiKeyService);
  const apiKeyRepository = app.get<Repository<ApiKey>>(
    getRepositoryToken(ApiKey),
  );

  const replServer = repl.start({
    prompt: "iluvcoffee> ",
    ignoreUndefined: true,
  });

  replServer.context.close = async () => {
    await app.close();
    replServer.close();
  };

  replServer.context.usersService = usersService;
  replServer.context.apiKeyService = apiKeyService;
  replServer.context.apiKeyRepository = apiKeyRepository;
  replServer.context.hashPassword = (plain: string) => hashPassword(plain);

  replServer.context.createApiKey = async (userId: number, id: string) => {
    const { apiKey, hashedKey } = await apiKeyService.createAndHash(id);
    const entity = apiKeyRepository.create({
      key: hashedKey,
      uuid: id,
      userId,
    });
    const saved = await apiKeyRepository.save(entity);
    return { apiKey, saved };
  };

  replServer.context.listApiKeys = () => apiKeyRepository.find();
  replServer.context.listApiKeysByUserId = (userId: number) =>
    apiKeyRepository.find({ where: { userId } });

  replServer.context.listUsers = () => usersService.findAll();
  replServer.context.getUser = (id: number) => usersService.findOne(id);
  replServer.context.getUserByEmail = (email: string) =>
    usersService.findOneByEmail(email);

  replServer.context.createUser = async (
    email: string,
    plainPassword: string,
  ) => {
    const passwordHash = await hashPassword(plainPassword);
    return usersService.create({ email, password: passwordHash });
  };

  replServer.context.updateUser = async (id: number, patch: UserUpdatePatch) =>
    usersService.update(id, patch as UpdateUserDto);

  replServer.context.updateUserEmail = async (id: number, email: string) =>
    usersService.update(id, { email } as UpdateUserDto);

  replServer.context.updateUserByEmail = async (
    email: string,
    patch: UserUpdatePatch,
  ) => {
    const user = await usersService.findOneByEmail(email);
    if (!user) {
      throw new Error(`User not found for email: ${email}`);
    }
    return usersService.update(user.id, patch as UpdateUserDto);
  };

  replServer.context.updateUserPassword = async (
    id: number,
    plainPassword: string,
  ) => {
    const passwordHash = await hashPassword(plainPassword);
    return usersService.update(id, { password: passwordHash } as UpdateUserDto);
  };

  replServer.context.updateUserPasswordByEmail = async (
    email: string,
    plainPassword: string,
  ) => {
    const user = await usersService.findOneByEmail(email);
    if (!user) {
      throw new Error(`User not found for email: ${email}`);
    }
    const passwordHash = await hashPassword(plainPassword);
    return usersService.update(user.id, {
      password: passwordHash,
    } as UpdateUserDto);
  };

  replServer.context.deleteUser = async (id: number) => {
    await usersService.remove(id);
    return true;
  };

  replServer.on("exit", () => {
    void app.close();
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
