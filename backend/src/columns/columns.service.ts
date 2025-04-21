import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Column, ColumnDocument } from './schemas/column.schema';
import { Model } from 'mongoose';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectModel(Column.name)
    private readonly columnModel: Model<ColumnDocument>,
  ) {}

  async create(dto: CreateColumnDto): Promise<Column> {
    const created = new this.columnModel(dto);
    return created.save();
  }

  async findAll(): Promise<Column[]> {
    return this.columnModel.find().exec();
  }

  async findOne(id: string): Promise<Column> {
    const column = await this.columnModel.findById(id).exec();
    if (!column) {
      throw new NotFoundException(`Column with ID ${id} not found`);
    }
    return column;
  }

  async update(id: string, dto: UpdateColumnDto): Promise<Column> {
    const updated = await this.columnModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Column with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.columnModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Column with ID ${id} not found`);
    }
  }
}
