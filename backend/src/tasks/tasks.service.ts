import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Column, ColumnDocument } from '../columns/schemas/column.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schemas/department.schema';
import { getUserOrgIds } from '../auth/helpers/get-user-org-ids';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    @InjectModel(Column.name)
    private readonly columnModel: Model<ColumnDocument>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private async ensureColumnBelongsToScope(
    columnId: string,
    organizationId: string,
    departmentId: string,
  ): Promise<void> {
    const column = await this.columnModel.findById(columnId).exec();
    if (!column) {
      throw new NotFoundException(`Column with ID ${columnId} not found`);
    }

    if (column.departmentId.toString() !== departmentId) {
      throw new NotFoundException('Column does not belong to the given department');
    }

    const department = await this.departmentModel.findById(departmentId).exec();
    if (!department) {
      throw new NotFoundException(`Department with ID ${departmentId} not found`);
    }

    if (department.organizationId.toString() !== organizationId) {
      throw new NotFoundException(
        'Department does not belong to the given organization',
      );
    }
  }

  async create(dto: CreateTaskDto, createdBy: string): Promise<Task> {
    await this.ensureColumnBelongsToScope(
      dto.columnId,
      dto.organizationId,
      dto.departmentId,
    );

    const createdTask = new this.taskModel({
      ...dto,
      createdBy,
    });
    return createdTask.save();
  }

  async findAll(): Promise<Task[]> {
    return this.taskModel
      .find()
      .populate('columnId', 'name color order semantic departmentId')
      .exec();
  }

  async findAllByOrganizationIds(organizationIds: string[]): Promise<Task[]> {
    if (!organizationIds.length) return [];
    return this.taskModel
      .find({ organizationId: { $in: organizationIds } })
      .populate('columnId', 'name color order semantic departmentId')
      .exec();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskModel
      .findById(id)
      .populate('columnId', 'name color order semantic departmentId')
      .exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const existingTask = await this.taskModel.findById(id).exec();
    if (!existingTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const nextColumnId = dto.columnId ?? existingTask.columnId.toString();
    const nextOrganizationId =
      dto.organizationId ?? existingTask.organizationId.toString();
    const nextDepartmentId = dto.departmentId ?? existingTask.departmentId.toString();
    await this.ensureColumnBelongsToScope(
      nextColumnId,
      nextOrganizationId,
      nextDepartmentId,
    );

    const updated = await this.taskModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('columnId', 'name color order semantic departmentId')
      .exec();

    if (!updated) throw new NotFoundException(`Task with ID ${id} not found`);
    return updated;
  }

  async moveToColumn(id: string, columnId: string): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.ensureColumnBelongsToScope(
      columnId,
      task.organizationId.toString(),
      task.departmentId.toString(),
    );

    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, { columnId }, { new: true })
      .populate('columnId', 'name color order semantic departmentId')
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return updatedTask;
  }

  async claim(id: string, user: { userId: string; roles?: unknown[] }): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const taskOrgId = task.organizationId.toString();
    const userOrgIds = getUserOrgIds(user);
    if (!userOrgIds.includes(taskOrgId)) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    if (task.assignedTo) {
      throw new ConflictException('Task is already assigned');
    }

    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, { assignedTo: user.userId }, { new: true })
      .populate('columnId', 'name color order semantic departmentId')
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return updatedTask;
  }

  async unclaim(
    id: string,
    user: { userId: string; roles?: { organizationId?: unknown; role?: string }[] },
  ): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const taskOrgId = task.organizationId.toString();
    const isPrivileged = user.roles?.some(
      (role) =>
        role.organizationId?.toString() === taskOrgId &&
        ['admin', 'manager'].includes(String(role.role)),
    );
    const assignedToUserId = task.assignedTo?.toString();
    const isOwner = assignedToUserId === user.userId;

    if (!isPrivileged && !isOwner) {
      throw new ForbiddenException('You cannot unclaim this task');
    }

    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, { assignedTo: null }, { new: true })
      .populate('columnId', 'name color order semantic departmentId')
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return updatedTask;
  }

  async assignToUser(
    id: string,
    assigneeId: string,
    user: { userId: string; roles?: { organizationId?: unknown; role?: string }[] },
  ): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const taskOrgId = task.organizationId.toString();
    const isPrivileged = user.roles?.some(
      (role) =>
        role.organizationId?.toString() === taskOrgId &&
        ['admin', 'manager'].includes(String(role.role)),
    );
    if (!isPrivileged) {
      throw new ForbiddenException('Only manager/admin can assign this task');
    }

    const assignee = await this.userModel.findById(assigneeId).exec();
    if (!assignee) {
      throw new NotFoundException(`User with ID ${assigneeId} not found`);
    }

    const isWorkerInOrg = assignee.roles?.some(
      (role) =>
        role.organizationId?.toString() === taskOrgId && role.role === 'employee',
    );
    if (!isWorkerInOrg) {
      throw new ForbiddenException(
        'Assignee must be an employee in the same organization',
      );
    }

    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, { assignedTo: assigneeId }, { new: true })
      .populate('columnId', 'name color order semantic departmentId')
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return updatedTask;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.taskModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }
}
