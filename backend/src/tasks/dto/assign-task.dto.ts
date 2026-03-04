import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AssignTaskDto {
  @IsNotEmpty()
  @IsMongoId()
  assigneeId: string;
}
