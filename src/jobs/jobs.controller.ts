import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JobsService } from './providers/jobs.service';
import { CreateJobSourceDto } from './dtos/create-job-source.dto';
import { CreateJobTitleDto } from './dtos/create-job-title.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { FetchJobsParam } from './dtos/fetch-jobs-param.dto';
import { AdminAuth } from '../decorators/auth.decorator';
import { AuthType } from '../utils/auth-type.enum';
import { ScrapeJobsDto } from './dtos/scrape-jobs.dto';
import { JobLimitGuard } from '../guards/job-limit.guard';
import { ActiveUser } from '../decorators/active-user.decorator';
import { CURRENT_USAGE_KEY, MAX_LIMIT, RATE_LIMIT_KEY } from '../utils/constants';
import { LIMITS } from './utils/rate-limit-utils';
import { successResponse } from '../utils/res-util';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBearerAuth,
    ApiSecurity,
    ApiQuery,
} from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(AdminAuthGuard)
export class JobsController {
    constructor(
        private readonly jobsService: JobsService
    ) { }

    @Post('source')
    @ApiOperation({
        summary: 'Add a New Job Source',
        description: 'Allows an administrator to register a new external website or platform for job tracking.',
    })
    @ApiBody({
        type: CreateJobSourceDto,
        description: 'Details for the new job source (name and URL).',
    })
    @ApiResponse({
        status: 201,
        description: 'Job source successfully created.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized. Missing or invalid Bearer Token.' })
    @ApiResponse({ status: 403, description: 'Forbidden. User is not an Admin.' })
    async addJobSource(@Body() createJobSourceDto: CreateJobSourceDto) {
        return this.jobsService.createJobSource(createJobSourceDto)
    }

    @Post('title')
    @ApiOperation({
        summary: 'Add a New Trackable Job Title',
        description: 'Allows an administrator to add a specific job title to the system\'s list of trackable roles.',
    })
    @ApiBody({
        type: CreateJobTitleDto,
        description: 'The job title string to be tracked.',
    })
    @ApiResponse({
        status: 201,
        description: 'Job title successfully created.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized. Missing or invalid Bearer Token.' })
    async addJobTitle(@Body() createJobTitleDto: CreateJobTitleDto) {
        return this.jobsService.createJobTitle(createJobTitleDto)
    }

    @Post('scrape')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Initiate Job Scrape',
        description: 'Triggers the scraping process for a specific job ID. This is typically an asynchronous background task.',
    })
    @ApiBody({ type: ScrapeJobsDto, description: 'The job ID to be scraped.' })
    @ApiResponse({ status: 200, description: 'Scraping process successfully initiated (returns a status confirmation).' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Missing or invalid Bearer Token.' })
    @ApiResponse({ status: 403, description: 'Forbidden. User is not an Admin.' })
    @ApiResponse({ status: 404, description: 'Job ID not found or invalid.' })
    async scrapeJobs(@Body() scrapeJobsDto: ScrapeJobsDto) {
        return this.jobsService.scrapeJobs(scrapeJobsDto)
    }

    @Get()
    @AdminAuth(AuthType.None)
    @UseGuards(JobLimitGuard)
    @ApiOperation({
        summary: 'Retrieve a List of Jobs',
        description: 'Fetches jobs with optional filtering, pagination, and a rate-limit based on the user\'s tier. Supplying a Bearer Token grants access to higher limits and the pagination cursor.',
    })
    @ApiSecurity({})
    @ApiQuery({ name: 'tag', description: 'Optional filter by job tag.', required: false, type: String })
    @ApiQuery({ name: 'cursor', description: 'Optional cursor for pagination.', required: false, type: String })
    @ApiQuery({ name: 'limit', description: 'Optional limit, defaults to 10.', required: false, type: Number })
    async fetchJobs(
        @Query() fetchJobsParam: FetchJobsParam,
        @Req() req: Request,
        @ActiveUser() user?: { sub: string, tier: 'FREE' | 'PAID' }
    ) {
        console.log(user)

        let enforcedLimit: number;
        let canReturnCursor: boolean = false;

        if (!user) {
            enforcedLimit = LIMITS.UNREGISTERED;
        } else if (user.tier === 'PAID') {
            const requestedLimit = fetchJobsParam.limit || 10;
            enforcedLimit = Math.min(requestedLimit, 10);
            console.log(enforcedLimit)
            canReturnCursor = true;
        } else {
            enforcedLimit = LIMITS.FREE;
        }

        const jobsResult = await this.jobsService.fetchJobs({
            ...fetchJobsParam,
            limit: enforcedLimit,
        }, { currentUsage: req[CURRENT_USAGE_KEY], rateLimitKey: req[RATE_LIMIT_KEY], maxLimit: req[MAX_LIMIT] });

        const response: { jobs: any[]; next?: string } = {
            jobs: jobsResult.data,
        };

        if (canReturnCursor && jobsResult.next) {
            response.next = jobsResult.next;
        }

        return successResponse({ message: "Jobs fetched successfully", data: response });
    }
}
