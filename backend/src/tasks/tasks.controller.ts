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
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskColumnDto } from './dto/move-task-column.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaskAccessGuard } from '../auth/guards/task-access.guard';
import { getUserOrgIds } from '../auth/helpers/get-user-org-ids';

@Controller('tasks')
@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  private assertOrgMembership(user: { roles?: unknown[] }, orgId: string): void {
    const userOrgIds = getUserOrgIds(user);
    if (!userOrgIds.includes(orgId)) {
      throw new ForbiddenException('You do not have access to this organization');
    }
  }

  @Post()
  create(
    @Req() req: { user: { userId: string; roles?: unknown[] } },
    @Body() dto: CreateTaskDto,
  ) {
    this.assertOrgMembership(req.user, dto.organizationId);
    return this.tasksService.create(dto, req.user.userId);
  }

  @Get()
  findAll(@Req() req: { user: { roles?: unknown[] } }) {
    const userOrgIds = getUserOrgIds(req.user);
    return this.tasksService.findAllByOrganizationIds(userOrgIds);
  }

  @Get(':id')
  @UseGuards(TaskAccessGuard)
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Put(':id')
  @UseGuards(TaskAccessGuard)
  update(
    @Req() req: { user: { roles?: unknown[] } },
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    if (dto.organizationId) {
      this.assertOrgMembership(req.user, dto.organizationId.toString());
    }

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
