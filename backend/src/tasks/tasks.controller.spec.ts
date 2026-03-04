import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: {
    create: jest.Mock;
    findAllByOrganizationIds: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    moveToColumn: jest.Mock;
    claim: jest.Mock;
    unclaim: jest.Mock;
    assignToUser: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    tasksService = {
      create: jest.fn(),
      findAllByOrganizationIds: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      moveToColumn: jest.fn(),
      claim: jest.fn(),
      unclaim: jest.fn(),
      assignToUser: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: tasksService }],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create should call service with authenticated user id', async () => {
    const req = {
      user: { userId: 'u1', roles: [{ organizationId: 'org-1', role: 'employee' }] },
    };
    const dto = {
      title: 'T',
      description: 'D',
      columnId: 'c1',
      organizationId: 'org-1',
      departmentId: 'd1',
    };

    await controller.create(req, dto);

    expect(tasksService.create).toHaveBeenCalledWith(dto, 'u1');
  });

  it('findAll should scope by user organization ids', async () => {
    const req = {
      user: {
        roles: [
          { organizationId: 'org-1', role: 'employee' },
          { organizationId: 'org-2', role: 'manager' },
        ],
      },
    };

    await controller.findAll(req);

    expect(tasksService.findAllByOrganizationIds).toHaveBeenCalledWith([
      'org-1',
      'org-2',
    ]);
  });

  it('findOne should call service', async () => {
    await controller.findOne('task-1');
    expect(tasksService.findOne).toHaveBeenCalledWith('task-1');
  });

  it('update should reject organization not in user roles', async () => {
    const req = {
      user: { roles: [{ organizationId: 'org-1', role: 'employee' }] },
    };

    expect(() => controller.update(req, 'task-1', { organizationId: 'org-2' })).toThrow(
      ForbiddenException,
    );
    expect(tasksService.update).not.toHaveBeenCalled();
  });

  it('update should call service when organization is allowed', async () => {
    const req = {
      user: { roles: [{ organizationId: 'org-1', role: 'employee' }] },
    };
    const dto = { organizationId: 'org-1', title: 'Updated' };

    await controller.update(req, 'task-1', dto);

    expect(tasksService.update).toHaveBeenCalledWith('task-1', dto);
  });

  it('moveToColumn should call service', async () => {
    await controller.moveToColumn('task-1', { columnId: 'col-2' });
    expect(tasksService.moveToColumn).toHaveBeenCalledWith('task-1', 'col-2');
  });

  it('claim should call service with user', async () => {
    const req = {
      user: { userId: 'u1', roles: [{ organizationId: 'org-1', role: 'employee' }] },
    };
    await controller.claim(req, 'task-1');
    expect(tasksService.claim).toHaveBeenCalledWith('task-1', req.user);
  });

  it('unclaim should call service with user', async () => {
    const req = {
      user: { userId: 'u1', roles: [{ organizationId: 'org-1', role: 'employee' }] },
    };
    await controller.unclaim(req, 'task-1');
    expect(tasksService.unclaim).toHaveBeenCalledWith('task-1', req.user);
  });

  it('assign should call service with assignee and user', async () => {
    const req = {
      user: { userId: 'm1', roles: [{ organizationId: 'org-1', role: 'manager' }] },
    };
    await controller.assign(req, 'task-1', { assigneeId: 'u2' });
    expect(tasksService.assignToUser).toHaveBeenCalledWith('task-1', 'u2', req.user);
  });

  it('remove should call service', async () => {
    await controller.remove('task-1');
    expect(tasksService.remove).toHaveBeenCalledWith('task-1');
  });
});
