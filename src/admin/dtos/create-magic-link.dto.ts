import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateMagicLinkDto {

    @IsNotEmpty()
    @IsEmail()
    email: string
}