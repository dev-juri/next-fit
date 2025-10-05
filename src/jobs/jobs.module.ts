import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JobPost, JobPostSchema } from './schemas/job-post.schema';
import { JobSource, JobSourceSchema } from 'src/jobs/schemas/job-source.schema';
import { Job, JobSchema } from './schemas/job.schema';
import { AccessTokenGuard } from 'src/guards/access-token.guard';
import { AdminAuthGuard } from 'src/guards/admin-auth.guard';
import { JobsService } from './providers/jobs.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from 'src/config/jwt.config';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    MongooseModule.forFeature([
      {
        name: JobPost.name,
        schema: JobPostSchema
      },
      {
        name: JobSource.name,
        schema: JobSourceSchema
      },
      {
        name: Job.name,
        schema: JobSchema
      },
    ])],
  controllers: [JobsController],
  providers: [AccessTokenGuard, AdminAuthGuard, JobsService]
})
export class JobsModule { }
