import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './providers/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ) { }

    @Post()
    async signUp(@Body() createUserDto: CreateUserDto) {
        return this.usersService.signUp(createUserDto)
    }

    @Post('/auth')
    async login(@Body() loginUserDto: LoginUserDto) {
        return this.usersService.login(loginUserDto)
    }

}