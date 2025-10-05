import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './providers/admin.service';
import { CreateMagicLinkDto } from './dtos/create-magic-link.dto';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminAuthService: AdminService
    ) { }

    @Post('/auth')
    async sendMagicLink(@Body() createMagicLinkDto: CreateMagicLinkDto) {
        return this.adminAuthService.sendMagicLink(createMagicLinkDto.email);
    }

    @Get('/auth/verify')
    async verifyMagicLink(@Query('token') token: string) {
        return this.adminAuthService.verifyMagicLink(token);
    }
}
