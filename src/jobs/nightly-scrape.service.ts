import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { JobsService } from './providers/jobs.service';

@Injectable()
export class NightlyScrapeService {
    private readonly logger = new Logger(NightlyScrapeService.name)

    constructor(
        private readonly jobsService: JobsService
    ) {}

    @Cron('0 0 5 * * *', {
        name: NightlyScrapeService.name,
        timeZone: 'UTC',
        waitForCompletion: true
    })
    async handleNightlyScrape() {
        await this.jobsService.initNightlyScrape()
    }
}
