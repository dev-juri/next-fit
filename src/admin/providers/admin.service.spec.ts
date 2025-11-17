import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { SendMailProvider } from './send-mail.provider';
import * as crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { RequestContextService } from '../../tracing/request-context.service';
import { IResponse } from '../../../dist/utils/res-util';
import { successResponse } from '../../utils/res-util';

jest.mock('../../utils/res-util', () => ({
  successResponse: jest.fn((data) => ({
    success: true,
    data,
  })),
}));

jest.mock('crypto');

describe('AdminAuthService', () => {
  let service: AdminService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let eventEmitter: EventEmitter2;
  let sendMailProvider: SendMailProvider;
  let requestContextService: RequestContextService;

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

  const mockRequestContextService = {
    getRequestId: jest.fn()
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    //jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
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
        },
        {
          provide: RequestContextService,
          useValue: mockRequestContextService
        }],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService)
    eventEmitter = module.get<EventEmitter2>(EventEmitter2)
    sendMailProvider = module.get<SendMailProvider>(SendMailProvider)
    requestContextService = module.get<RequestContextService>(RequestContextService)
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

      expect(configService.get).toHaveBeenCalled();
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(eventEmitter.emit).toHaveBeenCalledWith('send.email', {
        email: ADMIN_EMAIL,
        requestId: 'N/A',
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
        fail('Expected UnauthorizedException to be thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(UnauthorizedException);
      }

      expect(configService.get).toHaveBeenCalled()
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    })

    it('should store the generated token with correct expiration time', async () => {
      const setSpy = jest.spyOn(service['magicTokens'], 'set');

      const now = Date.now();
      jest.spyOn(global.Date, 'now').mockReturnValue(now);

      await service.sendMagicLink(ADMIN_EMAIL);

      expect(setSpy).toHaveBeenCalledTimes(1);
      expect(setSpy).toHaveBeenCalledWith(
        MOCK_TOKEN,
        expect.objectContaining({
          email: ADMIN_EMAIL,
          expiresAt: expect.any(Date),
        })
      );
    });

    it('should log unsuccessful attempt with Request ID and throw 401 Unauthorized', async () => {
      const nonAdminEmail = 'bad@email.com';
      const mockRequestId = 'test-req-123';

      mockRequestContextService.getRequestId.mockReturnValue(mockRequestId);
      const logSpy = jest.spyOn(service['logger'], 'log');

      try {
        await service.sendMagicLink(nonAdminEmail);
        fail('Expected UnauthorizedException to be thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(UnauthorizedException);
      }
      expect(mockRequestContextService.getRequestId).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        `[${mockRequestId}] Admin login attempt for ${nonAdminEmail} failed.`,
      );
    });

    it('should log successful token generation and event emission with Request ID', async () => {
      const mockRequestId = 'success-req-456';

      mockRequestContextService.getRequestId.mockReturnValue(mockRequestId);
      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.sendMagicLink(ADMIN_EMAIL);

      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(logSpy).toHaveBeenNthCalledWith(
        1,
        `[${mockRequestId}] Token generation for ${ADMIN_EMAIL} successful.`
      );
      expect(logSpy).toHaveBeenNthCalledWith(
        2,
        `[${mockRequestId}] send.email event emitted for ${ADMIN_EMAIL}.`
      );
    });

    it('should use the provided Request ID when emitting the event', async () => {
      const mockRequestId = 'provided-req-id';

      mockRequestContextService.getRequestId.mockReturnValue(mockRequestId);

      await service.sendMagicLink(ADMIN_EMAIL);

      expect(eventEmitter.emit).toHaveBeenCalledWith('send.email', {
        email: ADMIN_EMAIL,
        requestId: mockRequestId,
        token: MOCK_TOKEN,
      });
    });
  })

  describe('verifyMagicLink', () => {
    const VALID_TOKEN = 'valid-token-xyz';
    const EXPIRED_TOKEN = 'expired-token-abc';
    const INVALID_TOKEN = 'non-existent-token';
    const GENERATED_JWT = 'mock-jwt-generated';
    const ADMIN_EMAIL = 'admin@example.com';
    const MOCK_REQUEST_ID = 'verify-req-111';

    const MOCK_CURRENT_TIME = new Date('2025-10-27T12:00:00.000Z');
    const MOCK_EXPIRES_AT_FUTURE = new Date('2025-10-27T12:15:00.000Z');
    const MOCK_EXPIRES_AT_PAST = new Date('2025-10-27T11:45:00.000Z');

    beforeEach(() => {
      jest.clearAllMocks();

      jest.spyOn(global, 'Date').mockImplementation(() => MOCK_CURRENT_TIME as any);

      mockRequestContextService.getRequestId.mockReturnValue(MOCK_REQUEST_ID);
      mockJwtService.sign.mockReturnValue(GENERATED_JWT);

      jest.spyOn(service['magicTokens'], 'get').mockImplementation((token: string) => {
        switch (token) {
          case VALID_TOKEN:
            return { email: ADMIN_EMAIL, expiresAt: MOCK_EXPIRES_AT_FUTURE };
          case EXPIRED_TOKEN:
            return { email: ADMIN_EMAIL, expiresAt: MOCK_EXPIRES_AT_PAST };
          default:
            return undefined;
        }
      });
    });

    afterAll(() => {
      (global.Date as any).mockRestore();
    });

    it('should successfully verify a valid, non-expired token and return access token', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      const delTokenSpy = jest.spyOn(service['magicTokens'], 'delete')

      await service.verifyMagicLink(VALID_TOKEN);

      expect(delTokenSpy).toHaveBeenCalledWith(VALID_TOKEN);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { email: ADMIN_EMAIL, role: 'admin' },
        { expiresIn: '7d' },
      );

      expect(logSpy).toHaveBeenCalledWith(
        `[${MOCK_REQUEST_ID}] Access Token generated for admin.`,
      );

    });

    it('should throw UnauthorizedException and log for an invalid token', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');

      await expect(service.verifyMagicLink(INVALID_TOKEN)).rejects.toThrow(UnauthorizedException);
      await expect(service.verifyMagicLink(INVALID_TOKEN)).rejects.toThrow('Invalid token');

      expect(logSpy).toHaveBeenCalledWith(`[${MOCK_REQUEST_ID}] Token invalid`);

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should delete the token upon successful verification', async () => {
      let delTokenSpy = jest.spyOn(service['magicTokens'], 'delete')

      await service.verifyMagicLink(VALID_TOKEN);
      expect(delTokenSpy).toHaveBeenCalledWith(VALID_TOKEN);
      expect(delTokenSpy).toHaveBeenCalledTimes(1);
    });

  });
})
