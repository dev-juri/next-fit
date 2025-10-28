import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { JobsService } from './providers/jobs.service';

@Injectable()
export class NightlyScrapeService {
    private readonly logger = new Logger(NightlyScrapeService.name)

    constructor(
        private readonly jobsService: JobsService
    ) {}

    @Cron('0 31 6 * * *', {
        name: NightlyScrapeService.name,
        timeZone: 'Africa/Lagos',
        waitForCompletion: true
    })
    async handleNightlyScrape() {
        await this.jobsService.initNightlyScrape()
    }
}
