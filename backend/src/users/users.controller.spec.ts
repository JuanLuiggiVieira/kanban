import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service', async () => {
    const dto = { name: 'A', email: 'a@test.com', password: '123' };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll should call service', async () => {
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('findOne should call service', async () => {
    await controller.findOne('u1');
    expect(service.findOne).toHaveBeenCalledWith('u1');
  });

  it('update should call service', async () => {
    const dto = { name: 'B' };
    await controller.update('u1', dto);
    expect(service.update).toHaveBeenCalledWith('u1', dto);
  });

  it('remove should call service', async () => {
    await controller.remove('u1');
    expect(service.remove).toHaveBeenCalledWith('u1');
  });
});
