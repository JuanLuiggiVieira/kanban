import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { TasksService } from '../../tasks/tasks.service';

@Injectable()
export class TaskAccessGuard implements CanActivate {
  constructor(private readonly tasksService: TasksService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const taskId = req.params.id;

    if (!user || !taskId) return false;

    const task = await this.tasksService.findOne(taskId);
    const userId = user.userId;

    // 🔒 Se for task pessoal, só o criador pode mexer (independente da role)
    if (task.isPersonal && task.createdBy.toString() !== userId) {
      throw new ForbiddenException('You cannot access this personal task');
    }

    // ✅ Admins e managers podem modificar qualquer outra task
    const isPrivileged = user.roles?.some((role) =>
      ['admin', 'manager'].includes(role.role),
    );
    if (isPrivileged) return true;

    // ✅ Funcionário pode modificar se for assigned a si ou sem dono
    const assignedTo = task.assignedTo?.toString();
    const isAllowed = !task.assignedTo || assignedTo === userId;

    if (isAllowed) return true;

    throw new ForbiddenException('You cannot modify this task');
  }
}
