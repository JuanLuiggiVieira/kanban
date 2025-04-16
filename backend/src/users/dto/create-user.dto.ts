import { IsEmail, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class RoleEntryDto {
  @IsNotEmpty()
  organizationId: Types.ObjectId;

  @IsNotEmpty()
  role: 'admin' | 'manager' | 'employee';
}

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleEntryDto)
  roles: RoleEntryDto[];
}
