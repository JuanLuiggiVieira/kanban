import { Test, TestingModule } from '@nestjs/testing';
import { MeController } from './me.controller';
import { UsersService } from './users.service';

describe('MeController', () => {
  let controller: MeController;
  let service: { getPersonalBoard: jest.Mock };

  beforeEach(async () => {
    service = {
      getPersonalBoard: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<MeController>(MeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getPersonalBoard should call service with authenticated user id', async () => {
    const req = { user: { userId: 'user-1' } };
    await controller.getPersonalBoard(req);
    expect(service.getPersonalBoard).toHaveBeenCalledWith('user-1');
  });
});
