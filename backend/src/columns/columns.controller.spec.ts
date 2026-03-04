import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';
import { DepartmentsService } from '../departments/departments.service';

describe('ColumnsController', () => {
  let controller: ColumnsController;
  let columnsService: {
    create: jest.Mock;
    findAllByDepartmentId: jest.Mock;
    findAllByDepartmentIds: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let departmentsService: {
    findOne: jest.Mock;
    findAllByOrganizationIds: jest.Mock;
  };

  beforeEach(async () => {
    columnsService = {
      create: jest.fn(),
      findAllByDepartmentId: jest.fn(),
      findAllByDepartmentIds: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    departmentsService = {
      findOne: jest.fn(),
      findAllByOrganizationIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ColumnsController],
      providers: [
        { provide: ColumnsService, useValue: columnsService },
        { provide: DepartmentsService, useValue: departmentsService },
      ],
    }).compile();

    controller = module.get<ColumnsController>(ColumnsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should reject when department org is not in user roles', async () => {
    departmentsService.findOne.mockResolvedValue({
      organizationId: { toString: () => 'org-2' },
    });
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };

    await expect(
      controller.create(req, {
        name: 'Col',
        color: '#fff',
        departmentId: 'dep-1',
        order: 0,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('create should call service when allowed', async () => {
    departmentsService.findOne.mockResolvedValue({
      organizationId: { toString: () => 'org-1' },
    });
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };
    const dto = { name: 'Col', color: '#fff', departmentId: 'dep-1', order: 0 };

    await controller.create(req, dto);
    expect(columnsService.create).toHaveBeenCalledWith(dto);
  });

  it('findAll with departmentId should enforce membership', async () => {
    departmentsService.findOne.mockResolvedValue({
      organizationId: { toString: () => 'org-2' },
    });
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };

    await expect(controller.findAll(req, 'dep-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('findAll with departmentId should call scoped service', async () => {
    departmentsService.findOne.mockResolvedValue({
      organizationId: { toString: () => 'org-1' },
    });
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };

    await controller.findAll(req, 'dep-1');
    expect(columnsService.findAllByDepartmentId).toHaveBeenCalledWith('dep-1');
  });

  it('findAll without departmentId should map user org departments', async () => {
    departmentsService.findAllByOrganizationIds.mockResolvedValue([
      { _id: { toString: () => 'dep-1' } },
      { _id: { toString: () => 'dep-2' } },
    ]);
    const req = {
      user: {
        roles: [
          { organizationId: 'org-1', role: 'employee' },
          { organizationId: 'org-2', role: 'manager' },
        ],
      },
    };

    await controller.findAll(req);
    expect(columnsService.findAllByDepartmentIds).toHaveBeenCalledWith([
      'dep-1',
      'dep-2',
    ]);
  });

  it('findOne should enforce membership via department', async () => {
    columnsService.findOne.mockResolvedValue({ departmentId: { toString: () => 'dep-1' } });
    departmentsService.findOne.mockResolvedValue({
      organizationId: { toString: () => 'org-2' },
    });
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'employee' }] } };

    await expect(controller.findOne(req, 'col-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('update should call service when source and target org are allowed', async () => {
    columnsService.findOne.mockResolvedValue({ departmentId: { toString: () => 'dep-1' } });
    departmentsService.findOne
      .mockResolvedValueOnce({ organizationId: { toString: () => 'org-1' } })
      .mockResolvedValueOnce({ organizationId: { toString: () => 'org-1' } });
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'manager' }] } };
    const dto = { departmentId: 'dep-2', name: 'Updated' };

    await controller.update(req, 'col-1', dto);
    expect(columnsService.update).toHaveBeenCalledWith('col-1', dto);
  });

  it('remove should call service when allowed', async () => {
    columnsService.findOne.mockResolvedValue({ departmentId: { toString: () => 'dep-1' } });
    departmentsService.findOne.mockResolvedValue({
      organizationId: { toString: () => 'org-1' },
    });
    const req = { user: { roles: [{ organizationId: 'org-1', role: 'manager' }] } };

    await controller.remove(req, 'col-1');
    expect(columnsService.remove).toHaveBeenCalledWith('col-1');
  });
});
