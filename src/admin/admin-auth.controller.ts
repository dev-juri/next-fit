import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AdminAuthService } from './providers/admin-auth.service';

@Controller('admin/auth')
export class AdminAuthController {
    constructor(
        private readonly adminAuthService: AdminAuthService
    ) { }

    @Post()
    async sendMagicLink(@Body('email') email: string) {
        return this.adminAuthService.sendMagicLink(email);
    }

    @Get('verify')
    async verifyMagicLink(@Query('token') token: string) {
        return this.adminAuthService.verifyMagicLink(token);
    }
}
