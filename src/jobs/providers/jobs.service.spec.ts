import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import createMockMongooseModel from '../../../test/__mocks__/model.mock';
import { JobSource, JobSourceDocument } from '../schemas/job-source.schema';
import { Job, JobDocument } from '../schemas/job.schema';
import { JobPost, JobPostDocument } from '../schemas/job-post.schema';
import { getModelToken } from '@nestjs/mongoose';
import { mockCacheManager, mockEventEmitter, mockSerpProvider } from '../../../test/__mocks__/service.mock';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SerpProvider } from './serp.provider';

describe('JobsService', () => {
  let service: JobsService;
  const mockJobSourceModel = createMockMongooseModel<JobSourceDocument>(null);
  const mockJobModel = createMockMongooseModel<JobDocument>(null);
  const mockJobPostModel = createMockMongooseModel<JobPostDocument>(null);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getModelToken(JobSource.name),
          useValue: mockJobSourceModel,
        },
        {
          provide: getModelToken(Job.name),
          useValue: mockJobModel,
        },
        {
          provide: getModelToken(JobPost.name),
          useValue: mockJobPostModel,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: SerpProvider,
          useValue: mockSerpProvider,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
