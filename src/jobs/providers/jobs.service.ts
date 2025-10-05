import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobSource, JobSourceDocument } from 'src/admin/schemas/job-source.schema';
import { CreateJobSourceDto } from '../dtos/create-job-source.dto';
import { CreateJobTitleDto } from '../dtos/create-job-title.dto';

@Injectable()
export class JobsService {
    constructor(
        @InjectModel(JobSource.name)
        private readonly jobSourceModel: Model<JobSourceDocument>
    ) { }

    async createJobTitle(createJobTitleDto: CreateJobTitleDto) { }

    async createJobSource(createJobSourceDto: CreateJobSourceDto) { }
}
