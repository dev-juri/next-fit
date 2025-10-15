import { Test, TestingModule } from '@nestjs/testing';
import { SerpProvider } from './serp.provider';

describe('SerpProvider', () => {
  let provider: SerpProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SerpProvider],
    }).compile();

    provider = module.get<SerpProvider>(SerpProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
