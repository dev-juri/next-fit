import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
    @ApiProperty({
        description: 'The user\'s first name.',
        example: 'John',
        minLength: 2,
    })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({
        description: 'The user\'s last name.',
        example: 'Doe',
        minLength: 2,
    })
    @IsString()
    @IsNotEmpty()
    lastName: string;

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
        description: 'The user\'s chosen password.',
        example: 'S3cur3P@ssw0rd!',
        minLength: 8,
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}