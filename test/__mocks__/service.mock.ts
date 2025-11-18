import { of } from 'rxjs';

export const mockJwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn(),
};

export const mockConfigService = {
    get: jest.fn(),
};

export const mockHttpService = {
    get: jest.fn(() => of({ data: {} })),
    post: jest.fn(() => of({ data: {} })),
};

export const mockEventEmitter = {
    emit: jest.fn(),
    emitAsync: jest.fn(),
};

export const mockSendMailProvider = {};

export const mockRequestContextService = {
    getRequestId: jest.fn()
}

export const mockSerpProvider = {
    search: jest.fn(),
};

export const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
};