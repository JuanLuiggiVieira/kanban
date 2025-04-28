import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: [
      {
        organizationId: {
          type: Types.ObjectId,
          ref: 'Organization',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'manager', 'employee'],
          required: true,
        },
      },
    ],
    default: [],
  })
  roles: {
    organizationId: Types.ObjectId;
    role: 'admin' | 'manager' | 'employee';
  }[];
}

export const UserSchema = SchemaFactory.createForClass(User);
