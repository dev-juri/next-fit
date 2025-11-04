import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginUserDto {
    @ApiProperty({
        description: 'The user\'s email address.',
        example: 'john.doe@example.com',
        minLength: 5,
    })
    @IsEmail()
    @IsNotEmpty()
    @Transform(({ value }) => value?.toLowerCase())
    email: string;

    @ApiProperty({
        description: 'The user\'s password.',
        example: 'S3cur3P@ssw0rd!',
        minLength: 8,
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}