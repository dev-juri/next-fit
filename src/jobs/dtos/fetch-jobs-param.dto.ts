import { IsNumber, IsOptional, IsString } from "class-validator";

export class FetchJobsParam {
    @IsString()
    @IsOptional()
    tag?: string;

    @IsString()
    @IsOptional()
    cursor?: string;

    @IsNumber()
    @IsOptional()
    limit?: number = 10;
}

export interface FetchJobsOptions {
    currentUsage: number; 
    rateLimitKey: string;
    maxLimit: number
}