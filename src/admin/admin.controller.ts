import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './providers/admin.service';
import { CreateMagicLinkDto } from './dtos/create-magic-link.dto';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService
    ) { }

    @Post('/auth')
    @ApiOperation({
        summary: 'Request a Magic Link for Admin Login',
        description:
            'Sends a unique, time-sensitive login link (Magic Link) to the specified admin email address.',
    })
    @ApiBody({
        type: CreateMagicLinkDto,
        description: 'The email address of the admin user.',
    })
    @ApiResponse({
        status: 201,
        description: 'Magic Link successfully sent to the email.',
    })
    @ApiResponse({ status: 400, description: 'Invalid email format or missing email.' })
    async sendMagicLink(@Body() createMagicLinkDto: CreateMagicLinkDto) {
        return this.adminService.sendMagicLink(createMagicLinkDto.email);
    }

    @Get('/auth/verify')
    @ApiOperation({
        summary: 'Verify Magic Link and Authenticate Admin',
        description:
            'Exchanges the received Magic Link token for a session or authentication token (e.g., a JWT).',
    })
    @ApiQuery({
        name: 'token',
        description: 'The unique token received in the Magic Link URL.',
        example: 'aBcDeFg1234567890HjKlMn',
        required: true,
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Token successfully verified. Returns authentication data.',
    })
    @ApiResponse({ status: 401, description: 'Invalid or expired token.' })
    async verifyMagicLink(@Query('token') token: string) {
        return this.adminService.verifyMagicLink(token);
    }
}
