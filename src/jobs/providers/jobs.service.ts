import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobSource, JobSourceDocument } from '../schemas/job-source.schema';
import { CreateJobSourceDto } from '../dtos/create-job-source.dto';
import { CreateJobTitleDto } from '../dtos/create-job-title.dto';
import { Job, JobDocument } from '../schemas/job.schema';
import { successResponse } from 'src/utils/res-util';

@Injectable()
export class JobsService {
    constructor(
        @InjectModel(JobSource.name)
        private readonly jobSourceModel: Model<JobSourceDocument>,

        @InjectModel(Job.name)
        private readonly jobModel: Model<JobDocument>
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
}
