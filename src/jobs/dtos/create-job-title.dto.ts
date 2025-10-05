import { IsNotEmpty, IsString } from "class-validator";

export class CreateJobTitleDto {
    @IsString()
    @IsNotEmpty()
    title: string
}