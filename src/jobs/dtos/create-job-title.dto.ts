import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateJobTitleDto {
    @ApiProperty({
        description: 'The name of the job title to be created.',
        example: 'Full Stack Developer',
    })
    @IsString()
    @IsNotEmpty()
    title: string
}