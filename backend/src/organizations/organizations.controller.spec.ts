import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let service: {
    create: jest.Mock;
    findAllByIds: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAllByIds: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [{ provide: OrganizationsService, useValue: service }],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service', async () => {
    const dto = { name: 'Org' };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll should scope by role org ids', async () => {
    const req = {
      user: {
        roles: [
          { organizationId: 'org-1', role: 'employee' },
          { organizationId: 'org-2', role: 'manager' },
        ],
      },
    };
    await controller.findAll(req);
    expect(service.findAllByIds).toHaveBeenCalledWith(['org-1', 'org-2']);
  });

  it('findOne should reject cross-org access', async () => {
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };
    await expect(controller.findOne(req, 'org-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(service.findOne).not.toHaveBeenCalled();
  });

  it('findOne should call service for allowed org', async () => {
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };
    await controller.findOne(req, 'org-1');
    expect(service.findOne).toHaveBeenCalledWith('org-1');
  });

  it('update should enforce membership', async () => {
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };
    expect(() => controller.update(req, 'org-2', { name: 'x' })).toThrow(
      ForbiddenException,
    );
  });

  it('remove should call service for allowed org', async () => {
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };
    await controller.remove(req, 'org-1');
    expect(service.remove).toHaveBeenCalledWith('org-1');
  });
});
