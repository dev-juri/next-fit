import { Test, TestingModule } from '@nestjs/testing';
import { SerpProvider } from './serp.provider';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { mockConfigService, mockHttpService } from '../../../test/__mocks__/service.mock';

describe('SerpProvider', () => {
  let provider: SerpProvider;
  let configService: ConfigService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SerpProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },],
    }).compile();

    provider = module.get<SerpProvider>(SerpProvider);
    configService = module.get<ConfigService>(ConfigService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
