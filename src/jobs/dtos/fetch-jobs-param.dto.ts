import { IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class FetchJobsParam {
    @ApiProperty({
        description: 'Optional filter to fetch jobs associated with a specific tag (e.g., "frontend", "remote").',
        example: 'Backend Development',
        required: false,
    })
    @IsString()
    @IsOptional()
    tag?: string;

    @ApiProperty({
        description: 'Optional cursor string for pagination to fetch the next page of results.',
        example: 'NTg1Y2JmZmYyOWRkZWMwMDllMjFkNjVm',
        required: false,
    })
    @IsString()
    @IsOptional()
    cursor?: string;

    @ApiProperty({
        description: 'The maximum number of jobs to return in a single request. Defaults to 10.',
        example: 5,
        default: 10,
        required: false,
        type: Number,
    })
    @IsNumber()
    @IsOptional()
    limit?: number = 10;
}

export interface FetchJobsOptions {
    currentUsage: number; 
    rateLimitKey: string;
    maxLimit: number
}