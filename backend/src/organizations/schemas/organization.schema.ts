import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  logo?: string;

  @Prop()
  description?: string;

  @Prop({ enum: ['WORKSPACE', 'PERSONAL'], default: 'WORKSPACE' })
  type: 'WORKSPACE' | 'PERSONAL';

  @Prop({ type: Types.ObjectId, ref: 'User' })
  ownerId?: Types.ObjectId;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
