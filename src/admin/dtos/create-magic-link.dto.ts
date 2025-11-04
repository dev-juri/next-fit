import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty } from "class-validator";

export class CreateMagicLinkDto {

    @ApiProperty({
        description: 'The email address of the admin user requesting a login link.',
        example: 'admin@nextfit.com',
        minLength: 5,
        maxLength: 255,
    })
    @IsNotEmpty()
    @IsEmail()
    @Transform(({ value }) => value?.toLowerCase())
    email: string
}