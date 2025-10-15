import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { JobsService } from './providers/jobs.service';
import { CreateJobSourceDto } from './dtos/create-job-source.dto';
import { CreateJobTitleDto } from './dtos/create-job-title.dto';
import { AdminAuthGuard } from 'src/guards/admin-auth.guard';
import { FetchJobsParam } from './dtos/fetch-jobs-param.dto';
import { AdminAuth } from 'src/decorators/auth.decorator';
import { AuthType } from 'src/utils/auth-type.enum';
import { ScrapeJobsDto } from './dtos/scrape-jobs.dto';

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

    @Post('scrape')
    @HttpCode(HttpStatus.OK)
    async scrapeJobs(@Body() scrapeJobsDto: ScrapeJobsDto) {
        return this.jobsService.scrapeJobs(scrapeJobsDto)
    }

    @Get()
    @AdminAuth(AuthType.None)
    async fetchJobs(@Query() fetchJobsParam: FetchJobsParam) {
        return this.jobsService.fetchJobs(fetchJobsParam)
    }
}
