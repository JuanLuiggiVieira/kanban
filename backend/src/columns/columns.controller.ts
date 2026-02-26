import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentsService } from '../departments/departments.service';
import { getUserOrgIds } from '../auth/helpers/get-user-org-ids';

@Controller('columns')
@ApiTags('Columns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ColumnsController {
  constructor(
    private readonly columnService: ColumnsService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  private assertOrgMembership(user: { roles?: unknown[] }, orgId: string): void {
    const userOrgIds = getUserOrgIds(user);
    if (!userOrgIds.includes(orgId)) {
      throw new ForbiddenException('You do not have access to this organization');
    }
  }

  @Post()
  async create(
    @Req() req: { user: { roles?: unknown[] } },
    @Body() dto: CreateColumnDto,
  ) {
    const department = await this.departmentsService.findOne(dto.departmentId);
    this.assertOrgMembership(req.user, department.organizationId.toString());

    return this.columnService.create(dto);
  }

  @Get()
  async findAll(
    @Req() req: { user: { roles?: unknown[] } },
    @Query('departmentId') departmentId?: string,
  ) {
    if (departmentId) {
      const department = await this.departmentsService.findOne(departmentId);
      this.assertOrgMembership(req.user, department.organizationId.toString());
      return this.columnService.findAllByDepartmentId(departmentId);
    }

    const userOrgIds = getUserOrgIds(req.user);
    const departments =
      await this.departmentsService.findAllByOrganizationIds(userOrgIds);
    const departmentIds = departments.map(
      (department) =>
        (
          department as unknown as {
            _id: { toString: () => string };
          }
        )._id.toString(),
    );

    return this.columnService.findAllByDepartmentIds(departmentIds);
  }

  @Get(':id')
  async findOne(@Req() req: { user: { roles?: unknown[] } }, @Param('id') id: string) {
    const column = await this.columnService.findOne(id);
    const department = await this.departmentsService.findOne(
      column.departmentId.toString(),
    );
    this.assertOrgMembership(req.user, department.organizationId.toString());

    return column;
  }

  @Put(':id')
  async update(
    @Req() req: { user: { roles?: unknown[] } },
    @Param('id') id: string,
    @Body() dto: UpdateColumnDto,
  ) {
    const currentColumn = await this.columnService.findOne(id);
    const currentDepartment = await this.departmentsService.findOne(
      currentColumn.departmentId.toString(),
    );
    this.assertOrgMembership(req.user, currentDepartment.organizationId.toString());

    if (dto.departmentId) {
      const targetDepartment = await this.departmentsService.findOne(
        dto.departmentId.toString(),
      );
      this.assertOrgMembership(req.user, targetDepartment.organizationId.toString());
    }

    return this.columnService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Req() req: { user: { roles?: unknown[] } }, @Param('id') id: string) {
    const currentColumn = await this.columnService.findOne(id);
    const currentDepartment = await this.departmentsService.findOne(
      currentColumn.departmentId.toString(),
    );
    this.assertOrgMembership(req.user, currentDepartment.organizationId.toString());

    return this.columnService.remove(id);
  }
}
