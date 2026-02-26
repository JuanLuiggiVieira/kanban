import { IsMongoId, IsNotEmpty } from 'class-validator';

export class MoveTaskColumnDto {
  @IsNotEmpty()
  @IsMongoId()
  columnId: string;
}
