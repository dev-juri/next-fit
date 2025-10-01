import { Test, TestingModule } from '@nestjs/testing';
import { SendMailProvider } from './send-mail.provider';

describe('SendMailProvider', () => {
  let provider: SendMailProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SendMailProvider],
    }).compile();

    provider = module.get<SendMailProvider>(SendMailProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
