import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JobsService } from './jobs/providers/jobs.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const jobsService = app.get(JobsService);

  try {
    console.log('Starting Nightly Scrape...');
    await jobsService.initNightlyScrape();
    console.log('Scrape Complete.');
  } catch (error) {
    console.error('Scrape Failed', error);
  }

  await app.close();
  process.exit(0);
}

bootstrap();