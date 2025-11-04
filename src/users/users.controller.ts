import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UsersService } from './providers/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ) { }

    @Post()
    @ApiOperation({
        summary: 'Register a New User',
        description: 'Creates a new user account with provided details (first name, last name, email, and password).',
    })
    @ApiBody({
        type: CreateUserDto,
        description: 'The user details required for registration.',
    })
    @ApiResponse({
        status: 201,
        description: 'User successfully registered. Returns the created user object or authentication token.',
    })
    @ApiResponse({ status: 400, description: 'Invalid input or a user with this email already exists.' })
    async signUp(@Body() createUserDto: CreateUserDto) {
        return this.usersService.signUp(createUserDto)
    }

    @Post('/auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'User Login',
        description: 'Authenticates a user using their email and password.',
    })
    @ApiBody({
        type: LoginUserDto,
        description: 'The user credentials (email and password).',
    })
    @ApiResponse({
        status: 200,
        description: 'Login successful. Returns an authentication token (e.g., JWT).',
    })
    @ApiResponse({ status: 404, description: 'User not found.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials (email or password).' })
    async login(@Body() loginUserDto: LoginUserDto) {
        return this.usersService.login(loginUserDto)
    }

}