import { ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import * as bcrypt from 'bcrypt'
import { successResponse } from '../../utils/res-util';
import { JwtService } from '@nestjs/jwt';
import { RequestContextService } from '../../tracing/request-context.service';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        private readonly requestContext: RequestContextService,

        private readonly jwtService: JwtService,

        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>
    ) { }

    async signUp(createUserDto: CreateUserDto) {
        const requestId = this.requestContext.getRequestId() || 'N/A';

        let user = await this.userModel.findOne({
            email: createUserDto.email
        })

        if (user) {
            this.logger.log(`[${requestId}] User with ${createUserDto.email} exists.`)
            throw new ConflictException('User exists')
        }

        const saltRounds = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);
        createUserDto.password = hashedPassword

        user = await this.userModel.create({
            passwordHash: hashedPassword,
            ...createUserDto
        })
        this.logger.log(`[${requestId}] User ${user.id} created successfully.`)

        return successResponse({ message: "User created successfully" })
    }

    async login(loginUserDto: LoginUserDto) {
        const requestId = this.requestContext.getRequestId() || 'N/A';

        const user = await this.userModel.findOne({
            email: loginUserDto.email
        })

        if (!user) {
            this.logger.log(`[${requestId}] Login attempt: ${loginUserDto.email} doesn't exist.`)
            throw new NotFoundException('User not found')
        }

        const isCorrectPassword = await bcrypt.compare(loginUserDto.password, user.passwordHash);
        if (!isCorrectPassword) {
            this.logger.log(`[${requestId}] ${loginUserDto.email} Login attempt: Incorrect password.`)
            throw new UnauthorizedException('Incorrect login credentials');
        }

        const accessToken = this.jwtService.sign(
            { sub: user.id, role: 'guest', tier: 'PAID' },
            { expiresIn: '7d' },
        );

        this.logger.log(`[${requestId}] Login attempt successful.`)

        return successResponse({ message: 'Authentication Successful', data: { accessToken } });
    }
}
