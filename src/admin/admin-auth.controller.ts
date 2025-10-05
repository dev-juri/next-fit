import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminAuthService } from './providers/admin-auth.service';
import { CreateMagicLinkDto } from './dtos/create-magic-link.dto';

@Controller('admin/auth')
export class AdminAuthController {
    constructor(
        private readonly adminAuthService: AdminAuthService
    ) { }

    @Post()
    async sendMagicLink(@Body() createMagicLinkDto: CreateMagicLinkDto) {
        return this.adminAuthService.sendMagicLink(createMagicLinkDto.email);
    }

    @Get('verify')
    async verifyMagicLink(@Query('token') token: string) {
        return this.adminAuthService.verifyMagicLink(token);
    }
}
