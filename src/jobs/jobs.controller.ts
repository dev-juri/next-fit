import { Controller, Post } from '@nestjs/common';
import { JobsService } from './providers/jobs.service';
import { CreateJobSourceDto } from './dtos/create-job-source.dto';
import { CreateJobTitleDto } from './dtos/create-job-title.dto';

@Controller('jobs')
export class JobsController {
    constructor(
        private readonly jobsService: JobsService
    ) {}

    @Post('source')
    async addJobSource(createJobSourceDto: CreateJobSourceDto) {}

    @Post('title')
    async addJobTitle(createJobTitleDto: CreateJobTitleDto) {}
}
