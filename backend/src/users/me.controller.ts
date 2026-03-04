import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('me')
@ApiTags('Me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get('personal-board')
  getPersonalBoard(@Req() req: { user: { userId: string } }) {
    return this.usersService.getPersonalBoard(req.user.userId);
  }
}
