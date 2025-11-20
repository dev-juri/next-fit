import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
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
    ApiParam,
} from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(AdminAuthGuard)
export class JobsController {
    constructor(
        private readonly jobsService: JobsService
    ) { }

    @Post('sources')
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

    @Post('titles')
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

    @Get('titles')
    @ApiOperation({
        summary: 'Get List of Job Titles',
        description: 'Retrieves a cursor-paginated list of all trackable job titles.',
    })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'The cursor for the next page.' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'The maximum number of items to return (max 10).' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of job titles fetched successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async fetchJobTitles() {
        const results = await this.jobsService.fetchJobTitles();
        return successResponse({ message: 'Job titles fetched successfully.', data: results });
    }

    @Get('sources')
    @ApiOperation({
        summary: 'Get List of Job Sources (Paginated)',
        description: 'Retrieves a cursor-paginated list of all registered job sources/websites.',
    })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'The cursor for the next page.' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'The maximum number of items to return (max 10).' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of job sources fetched successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async fetchJobSources(@Query() { cursor, limit }: FetchJobsParam) {
        const results = await this.jobsService.fetchJobSources(cursor, limit);
        return successResponse({ message: 'Job sources fetched successfully.', data: results });
    }

    @Get('tags')
    @AdminAuth(AuthType.None)
    @ApiOperation({
        summary: 'Get List of Unique Job Tags',
        description: 'Retrieves all unique job tags from job posts. Results are cached for 1 hour.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of job tags fetched successfully.',
    })
    async fetchJobTags() {
        return this.jobsService.fetchJobTags();
    }

    @Delete('titles/:id')
    @ApiOperation({
        summary: 'Delete a Job Title',
        description: 'Permanently removes a trackable job title by its ID.',
    })
    @ApiParam({ name: 'id', description: 'The unique ID of the job title.', type: String })
    @ApiResponse({ status: 200, description: 'Job title deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Job title not found.' })
    async deleteJobTitle(@Param('id') id: string) {
        return this.jobsService.deleteJobTitle(id);
    }

    @Delete('sources/:id')
    @ApiOperation({
        summary: 'Delete a Job Source',
        description: 'Permanently removes a registered job source by its ID.',
    })
    @ApiParam({ name: 'id', description: 'The unique ID of the job source.', type: String })
    @ApiResponse({ status: 200, description: 'Job source deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Job source not found.' })
    async deleteJobSource(@Param('id') id: string) {
        return this.jobsService.deleteJobSource(id);
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
