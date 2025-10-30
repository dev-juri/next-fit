import { Test, TestingModule } from '@nestjs/testing';
import { SendMailProvider } from './send-mail.provider';
import { ConfigService } from '@nestjs/config';

describe('SendMailProvider', () => {
  let provider: SendMailProvider;

  let configService: ConfigService;
  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SendMailProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<SendMailProvider>(SendMailProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
