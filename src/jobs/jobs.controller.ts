import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JobsService } from './providers/jobs.service';
import { CreateJobSourceDto } from './dtos/create-job-source.dto';
import { CreateJobTitleDto } from './dtos/create-job-title.dto';
import { AdminAuthGuard } from 'src/guards/admin-auth.guard';

@Controller('jobs')
@UseGuards(AdminAuthGuard)
export class JobsController {
    constructor(
        private readonly jobsService: JobsService
    ) { }

    @Post('source')
    async addJobSource(@Body() createJobSourceDto: CreateJobSourceDto) {
        return this.jobsService.createJobSource(createJobSourceDto)
    }

    @Post('title')
    async addJobTitle(@Body() createJobTitleDto: CreateJobTitleDto) {
        return this.jobsService.createJobTitle(createJobTitleDto)
    }
}
