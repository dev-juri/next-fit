import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type JobDocument = HydratedDocument<Job>

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
export class Job {
    @Prop({ required: true, unique: true })
    title: string;

    @Prop({ required: false })
    lastScrapedAt?: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job)