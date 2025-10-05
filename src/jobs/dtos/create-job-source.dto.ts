import { IsNotEmpty, IsString, IsUrl } from "class-validator";

export class CreateJobSourceDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsUrl()
    @IsNotEmpty()
    url: string;
}