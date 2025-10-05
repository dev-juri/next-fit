import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type JobSourceDocument = HydratedDocument<JobSource>

@Schema({
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc: any, ret: any) => {
            ret.id = ret._id;
            delete ret._id;
            return ret;
        },
    },
})
export class JobSource {
    @Prop({ require: true })
    name: string;

    @Prop({ unique: true, required: true })
    url: string;
}

export const JobSourceSchema = SchemaFactory.createForClass(JobSource)