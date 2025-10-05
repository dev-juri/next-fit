import { Controller, UseGuards } from '@nestjs/common';
import { AdminService } from './providers/admin.service';
import { AdminAuthGuard } from 'src/guards/admin-auth.guard';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
    constructor(
        private readonly adminService: AdminService
    ) { }
}
