import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import * as bcrypt from 'bcrypt'
import { successResponse } from '../../utils/res-util';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
    constructor(

        private readonly jwtService: JwtService,

        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>
    ) { }

    async signUp(createUserDto: CreateUserDto) {
        const user = await this.userModel.findOne({
            email: createUserDto.email
        })

        if (user) {
            throw new ConflictException('User exists')
        }

        const saltRounds = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);
        createUserDto.password = hashedPassword

        await this.userModel.create({
            passwordHash: hashedPassword,
            ...createUserDto
        })

        return successResponse({ message: "User created successfully" })
    }

    async login(loginUserDto: LoginUserDto) {
        const user = await this.userModel.findOne({
            email: loginUserDto.email
        })

        if (!user) {
            throw new NotFoundException('User not found')
        }

        const isCorrectPassword = await bcrypt.compare(loginUserDto.password, user.passwordHash);
        if (!isCorrectPassword) {
            throw new UnauthorizedException('Incorrect login credentials');
        }

        const accessToken = this.jwtService.sign(
            { sub: user.id, role: 'guest', tier: 'PAID' },
            { expiresIn: '7d' },
        );

        return successResponse({ message: 'Authentication Successful', data: { accessToken } });
    }
}
