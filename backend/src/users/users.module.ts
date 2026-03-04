import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import {
  Organization,
  OrganizationSchema,
} from '../organizations/schemas/organization.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';
import { Column, ColumnSchema } from '../columns/schemas/column.schema';
import { MeController } from './me.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Column.name, schema: ColumnSchema },
    ]),
  ],
  controllers: [UsersController, MeController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
