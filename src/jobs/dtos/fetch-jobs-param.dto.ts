import { IsNumber, IsString } from "class-validator";

export class FetchJobsParam {
    @IsString()
    tag?: string;

    @IsNumber()
    limit?: number = 10;
}