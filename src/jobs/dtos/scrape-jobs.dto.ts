import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ScrapeJobsDto {
    @ApiProperty({
        description: 'The unique identifier for the job to be scraped.',
        example: '13fm2eu2ghjd2j28hjk',
    })
    @IsString()
    @IsNotEmpty()
    jobId: string;
}