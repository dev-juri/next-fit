import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JobsService } from './providers/jobs.service';
import { CreateJobSourceDto } from './dtos/create-job-source.dto';
import { CreateJobTitleDto } from './dtos/create-job-title.dto';
import { AdminAuthGuard } from 'src/guards/admin-auth.guard';
import { FetchJobsParam } from './dtos/fetch-jobs-param.dto';
import { AdminAuth } from 'src/decorators/auth.decorator';
import { AuthType } from 'src/utils/auth-type.enum';
import { ScrapeJobsDto } from './dtos/scrape-jobs.dto';
import { JobLimitGuard } from 'src/guards/job-limit.guard';
import { ActiveUser } from 'src/decorators/active-user.decorator';
import { CURRENT_USAGE_KEY, MAX_LIMIT, RATE_LIMIT_KEY } from '../utils/constants';
import { LIMITS } from './utils/rate-limit-utils';
import { successResponse } from 'src/utils/res-util';

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
    @UseGuards(JobLimitGuard)
    async fetchJobs(
        @Query() fetchJobsParam: FetchJobsParam,
        @Req() req: Request,
        @ActiveUser() user?: { id: string, tier: 'FREE' | 'PAID' }
    ) {

        let enforcedLimit: number;
        let canReturnCursor: boolean = false;

        if (!user) {
            enforcedLimit = LIMITS.UNREGISTERED;
        } else if (user.tier === 'PAID') {
            const requestedLimit = fetchJobsParam.limit || 10;
            enforcedLimit = Math.min(requestedLimit, 10);
            canReturnCursor = true;
        } else {
            enforcedLimit = LIMITS.FREE;
        }

        const jobsResult = await this.jobsService.fetchJobs({
            ...fetchJobsParam,
            limit: enforcedLimit,
        }, { currentUsage: req[CURRENT_USAGE_KEY], rateLimitKey: req[RATE_LIMIT_KEY], maxLimit: req[MAX_LIMIT] });

        const response: { data: any[]; next?: string } = {
            data: jobsResult.data,
        };

        if (canReturnCursor && jobsResult.next) {
            response.next = jobsResult.next;
        }

        return successResponse({ message: "Jobs fetched successfully", data: response.data });
    }
}
