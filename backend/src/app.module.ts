import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { DepartmentsModule } from './departments/departments.module';
import { ColumnsModule } from './columns/columns.module';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/kanban',
    ),
    OrganizationsModule,
    DepartmentsModule,
    ColumnsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
