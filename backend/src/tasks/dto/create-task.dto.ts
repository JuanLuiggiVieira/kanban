import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
  IsArray,
  IsDateString,
} from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsMongoId()
  columnId: string;

  @IsNotEmpty()
  @IsMongoId()
  organizationId: string;

  @IsNotEmpty()
  @IsMongoId()
  departmentId: string;

  @IsNotEmpty()
  @IsMongoId()
  createdBy: string;

  @IsOptional()
  @IsMongoId()
  assignedTo?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  isPersonal?: boolean;
}
