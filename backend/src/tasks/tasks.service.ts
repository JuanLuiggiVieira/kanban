import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Column, ColumnDocument } from '../columns/schemas/column.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    @InjectModel(Column.name)
    private readonly columnModel: Model<ColumnDocument>,
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

    // Department belongs to one organization in this model; tasks enforce explicit organization.
    if (!organizationId) {
      throw new NotFoundException('Organization ID is required');
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

  async remove(id: string): Promise<void> {
    const deleted = await this.taskModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }
}
