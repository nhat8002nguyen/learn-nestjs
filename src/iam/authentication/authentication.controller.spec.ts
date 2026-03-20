import { Test, TestingModule } from "@nestjs/testing";
import { AuthenticationController } from "./authentication.controller";
import { AuthenticationService } from "./authentication.service";

describe("AuthenticationController", () => {
  let controller: AuthenticationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: {
            signIn: jest.fn(),
            signUp: jest.fn(),
            signOut: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
