import { IsNotEmpty, IsString } from "class-validator";

export class ScrapeJobsDto {
    @IsString()
    @IsNotEmpty()
    jobId: string;
}