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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getUserOrgIds } from '../auth/helpers/get-user-org-ids';

@Controller('organizations')
@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  private assertOrgMembership(user: { roles?: unknown[] }, orgId: string): void {
    const userOrgIds = getUserOrgIds(user);
    if (!userOrgIds.includes(orgId)) {
      throw new ForbiddenException('You do not have access to this organization');
    }
  }

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.orgService.create(dto);
  }

  @Get()
  findAll(@Req() req: { user: { roles?: unknown[] } }) {
    const userOrgIds = getUserOrgIds(req.user);
    return this.orgService.findAllByIds(userOrgIds);
  }

  @Get(':id')
  async findOne(@Req() req: { user: { roles?: unknown[] } }, @Param('id') id: string) {
    this.assertOrgMembership(req.user, id);
    return this.orgService.findOne(id);
  }

  @Put(':id')
  update(
    @Req() req: { user: { roles?: unknown[] } },
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    this.assertOrgMembership(req.user, id);
    return this.orgService.update(id, dto);
  }

  @Delete(':id')
  remove(@Req() req: { user: { roles?: unknown[] } }, @Param('id') id: string) {
    this.assertOrgMembership(req.user, id);
    return this.orgService.remove(id);
  }
}
