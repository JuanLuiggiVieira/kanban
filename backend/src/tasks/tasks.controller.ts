import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskColumnDto } from './dto/move-task-column.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaskAccessGuard } from '../auth/guards/task-access.guard';

@Controller('tasks')
@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Req() req: { user: { userId: string } }, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @UseGuards(TaskAccessGuard)
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Put(':id')
  @UseGuards(TaskAccessGuard)
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Patch(':id/column')
  @UseGuards(TaskAccessGuard)
  moveToColumn(@Param('id') id: string, @Body() dto: MoveTaskColumnDto) {
    return this.tasksService.moveToColumn(id, dto.columnId);
  }

  @Delete(':id')
  @UseGuards(TaskAccessGuard)
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
