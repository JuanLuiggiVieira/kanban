import { TaskAccessGuard } from './task-access.guard';
import { ExecutionContext } from '@nestjs/common';
import { TasksService } from 'src/tasks/tasks.service';

describe('TaskAccessGuard', () => {
  let guard: TaskAccessGuard;
  let mockTasksService: Partial<TasksService>;

  const mockTask = {
    _id: 'task-id',
    isPersonal: false,
    createdBy: 'user-id',
    assignedTo: null,
  };

  beforeEach(() => {
    mockTasksService = {
      findOne: jest.fn().mockResolvedValue({ ...mockTask }),
    };
    guard = new TaskAccessGuard(mockTasksService as TasksService);
  });

  const mockExecutionContext = (user: any, taskId = 'task-id') =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params: { id: taskId },
        }),
      }),
    }) as unknown as ExecutionContext;

  it('should allow employee modifying unassigned task', async () => {
    const context = mockExecutionContext({
      userId: 'user-id',
      roles: [{ role: 'employee' }],
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow employee modifying task assigned to them', async () => {
    (mockTasksService.findOne as jest.Mock).mockResolvedValueOnce({
      ...mockTask,
      assignedTo: 'user-id',
    });

    const context = mockExecutionContext({
      userId: 'user-id',
      roles: [{ role: 'employee' }],
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should deny employee from modifying task assigned to another user', async () => {
    (mockTasksService.findOne as jest.Mock).mockResolvedValueOnce({
      ...mockTask,
      assignedTo: 'other-user',
    });

    const context = mockExecutionContext({
      userId: 'user-id',
      roles: [{ role: 'employee' }],
    });

    await expect(guard.canActivate(context)).rejects.toThrow();
  });

  it('should deny any user from accessing personal task not created by them', async () => {
    (mockTasksService.findOne as jest.Mock).mockResolvedValueOnce({
      ...mockTask,
      isPersonal: true,
      createdBy: 'other-user',
    });

    const context = mockExecutionContext({
      userId: 'user-id',
      roles: [{ role: 'admin' }],
    });

    await expect(guard.canActivate(context)).rejects.toThrow(/personal task/i);
  });

  it('should allow the creator to access their own personal task', async () => {
    (mockTasksService.findOne as jest.Mock).mockResolvedValueOnce({
      ...mockTask,
      isPersonal: true,
      createdBy: 'user-id',
    });

    const context = mockExecutionContext({
      userId: 'user-id',
      roles: [{ role: 'employee' }],
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow privileged user to access non-personal task', async () => {
    const context = mockExecutionContext({
      userId: 'admin-user',
      roles: [{ role: 'admin' }],
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
