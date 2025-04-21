import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
  IsNumber,
  IsBoolean,
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
  @IsBoolean()
  archived?: boolean;
}
