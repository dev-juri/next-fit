import { Injectable, Inject, NotFoundException, UnprocessableEntityException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobSource, JobSourceDocument } from '../schemas/job-source.schema';
import { CreateJobSourceDto } from '../dtos/create-job-source.dto';
import { CreateJobTitleDto } from '../dtos/create-job-title.dto';
import { Job, JobDocument } from '../schemas/job.schema';
import { successResponse } from 'src/utils/res-util';
import { FetchJobsParam, FetchJobsOptions } from '../dtos/fetch-jobs-param.dto';
import { JobPost, JobPostDocument } from '../schemas/job-post.schema';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ScrapeJobsDto } from '../dtos/scrape-jobs.dto';
import type { ScrapeJobsPayload } from '../events/scrape-job.type';
import { SerpProvider } from './serp.provider';
import { prepareJobPostsForBulkWrite } from '../utils/serp-transformer-utils';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { TTL_SECONDS } from '../utils/rate-limit-utils';

@Injectable()
export class JobsService {
    constructor(
        @InjectModel(JobSource.name)
        private readonly jobSourceModel: Model<JobSourceDocument>,

        @InjectModel(Job.name)
        private readonly jobModel: Model<JobDocument>,

        @InjectModel(JobPost.name)
        private readonly jobPostModel: Model<JobPostDocument>,

        private readonly eventEmitter: EventEmitter2,

        private readonly serpProvider: SerpProvider,

        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async createJobTitle(createJobTitleDto: CreateJobTitleDto) {
        const title = createJobTitleDto.title.split(' ')[0]

        const existingJobTitle = await this.jobModel.find({ where: { title } })
        if (existingJobTitle) {
            throw new UnprocessableEntityException('Job title already exists.')
        }

        const newJobTitle = await this.jobModel.create({ title })

        await newJobTitle.save()
        return successResponse({ message: "Job title added successfully." })
    }

    async createJobSource(createJobSourceDto: CreateJobSourceDto) {
        const existingJobSource = await this.jobSourceModel.find({ where: { url: createJobSourceDto.url } })
        if (existingJobSource) {
            throw new UnprocessableEntityException('Job source already exists.')
        }

        const newJobSource = await this.jobSourceModel.create(createJobSourceDto);
        await newJobSource.save()

        return successResponse({ message: "Job source added successfully." })
    }

    async scrapeJobs(scrapeJobsDto: ScrapeJobsDto) {
        const job = await this.jobModel.findById(scrapeJobsDto.jobId)
        if (!job) {
            throw new NotFoundException('Job title not found')
        }

        const sources = await this.jobSourceModel.find()
        const sourceUrlsString = sources
            .map(source => `site:${source.url}`)
            .join(' | ');

        this.eventEmitter.emit('scrape.jobs',
            {
                jobTitle: job.title,
                sourceString: sourceUrlsString,
                jobTag: job.title
            } as ScrapeJobsPayload
        )

        return successResponse({ message: "Scraping in progress" })
    }

    async fetchJobs(fetchJobsParam: FetchJobsParam, opts: FetchJobsOptions) {
        let { tag, limit = 10, cursor } = fetchJobsParam;

        const cachedLimitCount: number = (await this.cacheManager.get(opts.rateLimitKey)) || 0
        limit = Math.min(opts.maxLimit - cachedLimitCount, limit)

        console.log(limit)

        if (limit <= 0) {
            throw new ForbiddenException(
                `Rate limit exceeded, please try again tomorrow.`
            );
        }

        const query: any = {};

        if (tag) {
            query.tag = tag;
        }

        if (cursor) {
            query._id = { $gt: cursor };
        }

        const jobPosts = await this.jobPostModel
            .find(query)
            .sort({ _id: 1 })
            .limit(limit)
            .exec();

        const nextCursor = jobPosts.length > 0
            ? jobPosts[jobPosts.length - 1]._id.toString()
            : null;

        await this.incrementJobUsage(
            opts.rateLimitKey,
            jobPosts.length,
            opts.currentUsage
        );

        return {
            data: jobPosts,
            next: nextCursor
        };
    }

    async incrementJobUsage(key: string, jobsReturned: number, currentUsage: number): Promise<void> {
        if (jobsReturned > 0) {
            const newUsage = currentUsage + jobsReturned;
            await this.cacheManager.set(key, newUsage, TTL_SECONDS);
        }
    }

    async initNightlyScrape() {
        console.log('Starting nightly job scraping...');

        const allJobs = await this.jobModel.find();
        const allSources = await this.jobSourceModel.find();

        if (allJobs.length === 0) {
            return;
        }

        const sourceUrlsString = allSources
            .map(source => `site:${source.url}`)
            .join(' | ');

        const scrapePromises = allJobs.map(job =>
            this.processSingleJobScrape(job.title, sourceUrlsString, job.title)
        );
        const scrapeResults = await Promise.all(scrapePromises);

        const totalSaved = scrapeResults.reduce((sum, count) => sum + count, 0);

        console.log(`Nightly scrape complete. Total job posts upserted: ${totalSaved}`);
    }

    private async processSingleJobScrape(
        jobTitle: string,
        sourceUrlsString: string,
        jobTag: string
    ): Promise<number> {
        try {
            const fullQuery = `${jobTitle} | ${sourceUrlsString}`;

            const organicResults = await this.serpProvider.scrapeJob(jobTitle, fullQuery, 'qdr:d1');

            if (organicResults.length === 0) {
                console.log(`No results found for job: ${jobTitle}`);
                return 0;
            }

            const formattedJobPosts = prepareJobPostsForBulkWrite(organicResults, jobTag);

            const writeResult = await this.jobPostModel.bulkWrite(formattedJobPosts);

            const savedCount = writeResult.upsertedCount + writeResult.modifiedCount;
            console.log(`Scrape for "${jobTitle}" finished. Upserted ${savedCount} posts.`);

            return savedCount;

        } catch (error) {
            console.error(`Error scraping job title "${jobTitle}":`, error);
            return 0;
        }
    }

    // Events
    @OnEvent('scrape.jobs')
    async handleJobScrapingEvent(payload: ScrapeJobsPayload) {
        let sourceString: string = ""
        if (payload.sourceString.length > 0) {
            sourceString.concat(`| ${payload.sourceString}`)
        }
        const organicResults = await this.serpProvider.scrapeJob(payload.jobTitle, sourceString)

        const formattedJobPosts = prepareJobPostsForBulkWrite(organicResults, payload.jobTag)

        await this.jobPostModel.bulkWrite(formattedJobPosts);
    }

}
