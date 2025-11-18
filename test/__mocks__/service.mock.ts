export const mockJwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn(),
};

export const mockConfigService = {
    get: jest.fn(),
};

export const mockEventEmitter = {
    emit: jest.fn(),
};

export const mockSendMailProvider = {};

export const mockRequestContextService = {
    getRequestId: jest.fn()
}
