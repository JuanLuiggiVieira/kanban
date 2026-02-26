import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export class CreateColumnDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  color: string;

  @IsNotEmpty()
  @IsMongoId()
  departmentId: string;

  @IsNotEmpty()
  @IsNumber()
  order: number;

  @IsOptional()
  @IsEnum(['backlog', 'active', 'done', 'custom'])
  semantic?: 'backlog' | 'active' | 'done' | 'custom';

  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}
