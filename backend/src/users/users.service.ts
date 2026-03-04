import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import {
  Organization,
  OrganizationDocument,
} from '../organizations/schemas/organization.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schemas/department.schema';
import { Column, ColumnDocument } from '../columns/schemas/column.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    @InjectModel(Column.name) private columnModel: Model<ColumnDocument>,
  ) {}

  private async ensurePersonalBoardForUser(userId: string) {
    let organization = await this.organizationModel
      .findOne({
        ownerId: userId,
        type: 'PERSONAL',
      })
      .exec();

    if (!organization) {
      organization = await new this.organizationModel({
        name: `Personal Board (${userId})`,
        description: 'Private personal board',
        type: 'PERSONAL',
        ownerId: userId,
      }).save();
    }

    let department = await this.departmentModel
      .findOne({
        organizationId: organization._id,
        name: 'Personal Department',
      })
      .exec();

    if (!department) {
      department = await new this.departmentModel({
        name: 'Personal Department',
        description: 'Private department for personal priorities',
        organizationId: organization._id,
      }).save();
    }

    const existingColumns = await this.columnModel
      .find({ departmentId: department._id })
      .sort({ order: 1 })
      .exec();

    if (existingColumns.length === 0) {
      await this.columnModel.insertMany([
        {
          name: 'To Do',
          color: '#3B82F6',
          departmentId: department._id,
          order: 0,
          semantic: 'backlog',
          archived: false,
        },
        {
          name: 'Doing',
          color: '#F59E0B',
          departmentId: department._id,
          order: 1,
          semantic: 'active',
          archived: false,
        },
        {
          name: 'Done',
          color: '#10B981',
          departmentId: department._id,
          order: 2,
          semantic: 'done',
          archived: false,
        },
      ]);
    }

    const columns = await this.columnModel
      .find({ departmentId: department._id })
      .sort({ order: 1 })
      .exec();

    return { organization, department, columns };
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const createdUser = new this.userModel({
      ...createUserDto,
      roles: createUserDto.roles ?? [],
      password: hashedPassword,
    });

    const savedUser = await createdUser.save();

    const personalBoard = await this.ensurePersonalBoardForUser(
      savedUser._id.toString(),
    );

    const hasPersonalRole = savedUser.roles.some(
      (role) =>
        role.organizationId.toString() ===
        personalBoard.organization._id.toString(),
    );
    if (!hasPersonalRole) {
      savedUser.roles.push({
        organizationId:
          personalBoard.organization._id as unknown as Types.ObjectId,
        role: 'admin',
      });
      await savedUser.save();
    }

    return this.userModel.findById(savedUser._id).select('-password').exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();
  }

  async remove(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async getPersonalBoard(userId: string) {
    return this.ensurePersonalBoardForUser(userId);
  }
}
