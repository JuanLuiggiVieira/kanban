import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: { login: jest.Mock };

  beforeEach(async () => {
    service = { login: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login should call auth service with req.user', async () => {
    const req = { user: { _id: 'u1', email: 'a@test.com', roles: [] } };
    await controller.login(req);
    expect(service.login).toHaveBeenCalledWith(req.user);
  });
});
