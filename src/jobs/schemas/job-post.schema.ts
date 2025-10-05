import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type JobPostDocument = HydratedDocument<JobPost>

@Schema()
export class JobPost {
    @Prop({ required: true })
    title: string;

    @Prop({ unique: true, required: true })
    link: string;

    @Prop()
    snippet?: string;

    @Prop({ required: true, index: true })
    tag: string;
}

export const JobPostSchema = SchemaFactory.createForClass(JobPost)