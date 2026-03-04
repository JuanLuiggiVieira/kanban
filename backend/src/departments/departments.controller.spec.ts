import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let service: {
    create: jest.Mock;
    findAllByOrganizationId: jest.Mock;
    findAllByOrganizationIds: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAllByOrganizationId: jest.fn(),
      findAllByOrganizationIds: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [{ provide: DepartmentsService, useValue: service }],
    }).compile();

    controller = module.get<DepartmentsController>(DepartmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll with organizationId should enforce membership', async () => {
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };
    expect(() => controller.findAll(req, 'org-2')).toThrow(ForbiddenException);
  });

  it('findAll with organizationId should call scoped service', async () => {
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };
    await controller.findAll(req, 'org-1');
    expect(service.findAllByOrganizationId).toHaveBeenCalledWith('org-1');
  });

  it('findAll without organizationId should use user org ids', async () => {
    const req = {
      user: {
        roles: [
          { organizationId: 'org-1', role: 'employee' },
          { organizationId: 'org-2', role: 'manager' },
        ],
      },
    };
    await controller.findAll(req);
    expect(service.findAllByOrganizationIds).toHaveBeenCalledWith(['org-1', 'org-2']);
  });

  it('findOne should enforce department org membership', async () => {
    service.findOne.mockResolvedValue({ organizationId: { toString: () => 'org-2' } });
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };

    await expect(controller.findOne(req, 'dep-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('create should enforce dto.organizationId membership', async () => {
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };
    expect(() => controller.create(req, { name: 'D', organizationId: 'org-2' })).toThrow(
      ForbiddenException,
    );
  });

  it('create should call service for allowed org', async () => {
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };
    const dto = { name: 'D', organizationId: 'org-1' };
    await controller.create(req, dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('update should enforce current and target organization membership', async () => {
    service.findOne.mockResolvedValue({ organizationId: { toString: () => 'org-1' } });
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };

    await expect(
      controller.update(req, 'dep-1', { organizationId: 'org-2' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('remove should call service for allowed org', async () => {
    service.findOne.mockResolvedValue({ organizationId: { toString: () => 'org-1' } });
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };
    await controller.remove(req, 'dep-1');
    expect(service.remove).toHaveBeenCalledWith('dep-1');
  });
});
