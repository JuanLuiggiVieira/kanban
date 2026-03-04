import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken('User'),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            updateOne: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: getModelToken('Organization'),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getModelToken('Department'),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getModelToken('Column'),
          useValue: {
            find: jest.fn(),
            insertMany: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
