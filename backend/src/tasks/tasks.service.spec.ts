import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let taskModel: {
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };
  let userModel: {
    findById: jest.Mock;
  };

  beforeEach(async () => {
    taskModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    userModel = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getModelToken('Task'), useValue: taskModel },
        { provide: getModelToken('Column'), useValue: { findById: jest.fn() } },
        { provide: getModelToken('Department'), useValue: { findById: jest.fn() } },
        { provide: getModelToken('User'), useValue: userModel },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('claim should throw not found when task does not exist', async () => {
    taskModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    await expect(
      service.claim('task-1', {
        userId: 'u1',
        roles: [{ organizationId: 'org-1', role: 'employee' }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('claim should throw forbidden for cross-org user', async () => {
    taskModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        organizationId: { toString: () => 'org-1' },
        assignedTo: null,
      }),
    });

    await expect(
      service.claim('task-1', {
        userId: 'u1',
        roles: [{ organizationId: 'org-2', role: 'employee' }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('claim should throw conflict when task is already assigned', async () => {
    taskModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        organizationId: { toString: () => 'org-1' },
        assignedTo: { toString: () => 'u2' },
      }),
    });

    await expect(
      service.claim('task-1', {
        userId: 'u1',
        roles: [{ organizationId: 'org-1', role: 'employee' }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('claim should assign task to authenticated user', async () => {
    taskModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        organizationId: { toString: () => 'org-1' },
        assignedTo: null,
      }),
    });
    taskModel.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: 'task-1', assignedTo: 'u1' }),
    });

    const result = await service.claim('task-1', {
      userId: 'u1',
      roles: [{ organizationId: 'org-1', role: 'employee' }],
    });

    expect(taskModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'task-1',
      { assignedTo: 'u1' },
      { new: true },
    );
    expect(result).toEqual({ _id: 'task-1', assignedTo: 'u1' });
  });

  it('unclaim should reject employee not assigned to task', async () => {
    taskModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        organizationId: { toString: () => 'org-1' },
        assignedTo: { toString: () => 'u2' },
      }),
    });

    await expect(
      service.unclaim('task-1', {
        userId: 'u1',
        roles: [{ organizationId: 'org-1', role: 'employee' }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('unclaim should allow assigned employee', async () => {
    taskModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        organizationId: { toString: () => 'org-1' },
        assignedTo: { toString: () => 'u1' },
      }),
    });
    taskModel.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: 'task-1', assignedTo: null }),
    });

    const result = await service.unclaim('task-1', {
      userId: 'u1',
      roles: [{ organizationId: 'org-1', role: 'employee' }],
    });

    expect(taskModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'task-1',
      { assignedTo: null },
      { new: true },
    );
    expect(result).toEqual({ _id: 'task-1', assignedTo: null });
  });

  it('unclaim should allow manager/admin in same org', async () => {
    taskModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        organizationId: { toString: () => 'org-1' },
        assignedTo: { toString: () => 'u2' },
      }),
    });
    taskModel.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: 'task-1', assignedTo: null }),
    });

    await service.unclaim('task-1', {
      userId: 'm1',
      roles: [{ organizationId: 'org-1', role: 'manager' }],
    });

    expect(taskModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'task-1',
      { assignedTo: null },
      { new: true },
    );
  });

  it('assignToUser should reject non-manager/admin', async () => {
    taskModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        organizationId: { toString: () => 'org-1' },
      }),
    });

    await expect(
      service.assignToUser('task-1', 'u2', {
        userId: 'u1',
        roles: [{ organizationId: 'org-1', role: 'employee' }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assignToUser should reject missing assignee', async () => {
    taskModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        organizationId: { toString: () => 'org-1' },
      }),
    });
    userModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    await expect(
      service.assignToUser('task-1', 'u2', {
        userId: 'm1',
        roles: [{ organizationId: 'org-1', role: 'manager' }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('assignToUser should reject assignee outside employee role in org', async () => {
    taskModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        organizationId: { toString: () => 'org-1' },
      }),
    });
    userModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        roles: [{ organizationId: { toString: () => 'org-1' }, role: 'manager' }],
      }),
    });

    await expect(
      service.assignToUser('task-1', 'u2', {
        userId: 'm1',
        roles: [{ organizationId: 'org-1', role: 'admin' }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assignToUser should assign valid employee in same org', async () => {
    taskModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        organizationId: { toString: () => 'org-1' },
      }),
    });
    userModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        roles: [{ organizationId: { toString: () => 'org-1' }, role: 'employee' }],
      }),
    });
    taskModel.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: 'task-1', assignedTo: 'u2' }),
    });

    const result = await service.assignToUser('task-1', 'u2', {
      userId: 'm1',
      roles: [{ organizationId: 'org-1', role: 'manager' }],
    });

    expect(taskModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'task-1',
      { assignedTo: 'u2' },
      { new: true },
    );
    expect(result).toEqual({ _id: 'task-1', assignedTo: 'u2' });
  });
});
