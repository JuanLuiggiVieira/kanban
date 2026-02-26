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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getUserOrgIds } from '../auth/helpers/get-user-org-ids';

@Controller('departments')
@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly deptService: DepartmentsService) {}

  private assertOrgMembership(user: { roles?: unknown[] }, orgId: string): void {
    const userOrgIds = getUserOrgIds(user);
    if (!userOrgIds.includes(orgId)) {
      throw new ForbiddenException('You do not have access to this organization');
    }
  }

  @Get()
  findAll(
    @Req() req: { user: { roles?: unknown[] } },
    @Query('organizationId') organizationId?: string,
  ) {
    const userOrgIds = getUserOrgIds(req.user);
    if (organizationId) {
      this.assertOrgMembership(req.user, organizationId);
      return this.deptService.findAllByOrganizationId(organizationId);
    }

    return this.deptService.findAllByOrganizationIds(userOrgIds);
  }

  @Get(':id')
  async findOne(@Req() req: { user: { roles?: unknown[] } }, @Param('id') id: string) {
    const department = await this.deptService.findOne(id);
    this.assertOrgMembership(req.user, department.organizationId.toString());
    return department;
  }

  @Put(':id')
  async update(
    @Req() req: { user: { roles?: unknown[] } },
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    const existing = await this.deptService.findOne(id);
    this.assertOrgMembership(req.user, existing.organizationId.toString());

    if (dto.organizationId) {
      this.assertOrgMembership(req.user, dto.organizationId.toString());
    }

    return this.deptService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Req() req: { user: { roles?: unknown[] } }, @Param('id') id: string) {
    const existing = await this.deptService.findOne(id);
    this.assertOrgMembership(req.user, existing.organizationId.toString());

    return this.deptService.remove(id);
  }

  @Post()
  create(
    @Req() req: { user: { roles?: unknown[] } },
    @Body() dto: CreateDepartmentDto,
  ) {
    this.assertOrgMembership(req.user, dto.organizationId);
    return this.deptService.create(dto);
  }
}
