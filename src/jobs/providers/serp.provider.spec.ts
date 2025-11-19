import { Test, TestingModule } from '@nestjs/testing';
import { SerpProvider } from './serp.provider';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { mockConfigService, mockHttpService } from '../../../test/__mocks__/service.mock';
import * as serpapi from 'serpapi';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

jest.mock('serpapi', () => ({
  getJson: jest.fn(),
}));

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
        },
      ],
    }).compile();

    provider = module.get<SerpProvider>(SerpProvider);
    configService = module.get<ConfigService>(ConfigService);
    httpService = module.get<HttpService>(HttpService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('fetchJson', () => {
    it('should fetch json data successfully', async () => {
      const url = 'http://example.com/api';
      const apiKey = 'test-api-key';
      const mockResponse: AxiosResponse = {
        data: { some: 'data' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
            headers: undefined
        },
      };

      (configService.get as jest.Mock).mockReturnValue(apiKey);
      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      const result = await provider.fetchJson(url);

      expect(configService.get).toHaveBeenCalledWith('appConfig.serpApi');
      expect(httpService.get).toHaveBeenCalledWith(
        `${url}&api_key=${apiKey}`,
        expect.objectContaining({
          httpsAgent: expect.anything(),
        }),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when fetching json', async () => {
      const url = 'http://example.com/api';
      const error = new Error('Network Error');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (configService.get as jest.Mock).mockReturnValue('key');
      (httpService.get as jest.Mock).mockReturnValue(throwError(() => error));

      await provider.fetchJson(url);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Error fetching JSON from ${url}:`,
        error,
      );
      consoleSpy.mockRestore();
    });
  });

  describe('scrapeJob', () => {
    it('should scrape jobs successfully without pagination', async () => {
      const jobTitle = 'Software Engineer';
      const source = 'Google';
      const mockOrganicResults = [{ title: 'Job 1' }, { title: 'Job 2' }];
      const mockResponse = {
        organic_results: mockOrganicResults,
      };

      (configService.get as jest.Mock).mockReturnValue('test-api-key');
      (serpapi.getJson as jest.Mock).mockResolvedValue(mockResponse);

      const result = await provider.scrapeJob(jobTitle, source);

      expect(serpapi.getJson).toHaveBeenCalledWith(expect.objectContaining({
        api_key: 'test-api-key',
        engine: 'google',
        q: expect.stringContaining(source),
      }));
      expect(result).toEqual(mockOrganicResults);
    });

    it('should scrape jobs successfully with pagination', async () => {
      const jobTitle = 'Software Engineer';
      const source = 'Google';
      const mockOrganicResultsPage1 = [{ title: 'Job 1' }];
      const mockOrganicResultsPage2 = [{ title: 'Job 2' }];
      
      const mockResponsePage1 = {
        organic_results: mockOrganicResultsPage1,
        serpapi_pagination: {
          other_pages: {
            2: 'http://example.com/page2',
          },
        },
      };

      const mockResponsePage2 = {
        organic_results: mockOrganicResultsPage2,
      };

      (configService.get as jest.Mock).mockReturnValue('test-api-key');
      (serpapi.getJson as jest.Mock).mockResolvedValue(mockResponsePage1);
      
      jest.spyOn(provider, 'fetchJson').mockResolvedValue(mockResponsePage2);

      const result = await provider.scrapeJob(jobTitle, source);

      expect(serpapi.getJson).toHaveBeenCalled();
      expect(provider.fetchJson).toHaveBeenCalledWith('http://example.com/page2');
      expect(result).toEqual([...mockOrganicResultsPage1, ...mockOrganicResultsPage2]);
    });

    it('should return empty array if no results found', async () => {
      const jobTitle = 'Software Engineer';
      const source = 'Google';
      const mockResponse = {};

      (configService.get as jest.Mock).mockReturnValue('test-api-key');
      (serpapi.getJson as jest.Mock).mockResolvedValue(mockResponse);

      const result = await provider.scrapeJob(jobTitle, source);

      expect(result).toEqual([]);
    });
  });
});
