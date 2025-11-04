import { IsNotEmpty, IsString, IsUrl } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateJobSourceDto {
    @ApiProperty({
        description: 'The human-readable name of the job source (e.g., "BambooHR" or "LinkedIn Jobs").',
        example: 'BambooHR',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({
        description: 'The base URL of the job source, must be a valid URL.',
        example: 'https://www.bamboohr.com/',
        format: 'url',
    })
    @IsUrl()
    @IsNotEmpty()
    url: string;
}