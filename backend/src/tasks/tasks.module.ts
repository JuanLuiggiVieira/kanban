import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './schemas/task.schema';
import { TaskAccessGuard } from '../auth/guards/task-access.guard';
import { Column, ColumnSchema } from '../columns/schemas/column.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Column.name, schema: ColumnSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskAccessGuard],
  exports: [TasksService],
})
export class TasksModule {}
