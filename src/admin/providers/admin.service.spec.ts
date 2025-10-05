import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuthService } from './admin.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { SendMailProvider } from './send-mail.provider';
import * as crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('../../utils/res-util', () => ({
  successResponse: jest.fn((data) => ({
    success: true,
    data,
  })),
}));

jest.mock('crypto');

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let eventEmitter: EventEmitter2;
  let sendMailProvider: SendMailProvider;

  const mockJwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockSendMailProvider = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: SendMailProvider,
          useValue: mockSendMailProvider,
        },],
    }).compile();

    service = module.get<AdminAuthService>(AdminAuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService)
    eventEmitter = module.get<EventEmitter2>(EventEmitter2)
    sendMailProvider = module.get<SendMailProvider>(SendMailProvider)
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(configService).toBeDefined();
    expect(eventEmitter).toBeDefined();
    expect(sendMailProvider).toBeDefined();
  });

  describe('sendMagicLink', () => {
    const ADMIN_EMAIL = 'admin@example.com';
    const MOCK_TOKEN = 'mock-token-123456';

    beforeEach(() => {
      mockConfigService.get.mockReturnValue(ADMIN_EMAIL);
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue(MOCK_TOKEN),
      });
    });

    it('should send magic link for valid email', async () => {
      const result = await service.sendMagicLink(ADMIN_EMAIL);

      expect(configService.get).toHaveBeenCalledWith('ADMIN_EMAIL');
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(eventEmitter.emit).toHaveBeenCalledWith('send.email', {
        email: ADMIN_EMAIL,
        token: MOCK_TOKEN,
      });
      expect(result).toEqual({
        success: true,
        data: {
          message: 'Authentication link has been sent to your email address',
        },
      });
    })

    it('should throw Unauthorized Exception for Non-admin email', async () => {
      const nonAdminEmail = 'non-admin@example.com'

      try {
        await service.sendMagicLink(nonAdminEmail)
      } catch (err) {
        expect(err).toBeInstanceOf(UnauthorizedException)
      }

      expect(configService.get).toHaveBeenCalledWith('ADMIN_EMAIL')
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    })
  })
})
