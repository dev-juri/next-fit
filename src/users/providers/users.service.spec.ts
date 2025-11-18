import { Test, TestingModule } from "@nestjs/testing"
import { UsersService } from "./users.service";
import { JwtService } from "@nestjs/jwt";
import { RequestContextService } from "../../tracing/request-context.service";
import { mockJwtService, mockRequestContextService } from "../../../test/__mocks__/service.mock";
import createMockMongooseModel, { MockMongooseModel } from "../../../test/__mocks__/model.mock";
import { User, UserDocument } from "../schemas/user.schema";
import { getModelToken } from "@nestjs/mongoose";
import * as bcrypt from 'bcrypt'
import { ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";

jest.mock('bcrypt', () => ({
    genSalt: jest.fn(() => Promise.resolve('mockedSalt')),
    hash: jest.fn(() => Promise.resolve('mockedHashedPassword')),
    compare: jest.fn()
}));

const mockSuccessResponse = jest.fn((data) => ({ status: 'success', ...data }));


describe('UsersService', () => {
    let service: UsersService;
    let jwtService: JwtService;
    let requestContextService: RequestContextService;

    let userModel: MockMongooseModel<UserDocument>;

    const testCreateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'new.user@test.com',
        password: 'password123',
    };

    const testLoginUserDto = {
        email: 'existing.user@test.com',
        password: 'correctpassword',
    };

    const mockCreatedUser = {
        firstName: 'John',
        lastName: 'Doe',
        id: 'user-ulid-123',
        email: testCreateUserDto.email,
        passwordHash: 'mockedHashedPassword',
    } as unknown as UserDocument;

    const mockExistingUser = {
        id: 'user-ulid-456',
        email: testLoginUserDto.email,
        passwordHash: 'hashed_db_password_abc123',
        firstName: 'Jane',
        lastName: 'Doe',
    } as unknown as UserDocument;

    const mockUserFactory = createMockMongooseModel<User>(null);

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: RequestContextService,
                    useValue: mockRequestContextService
                },
                {
                    provide: getModelToken(User.name),
                    useValue: mockUserFactory,
                },
            ]
        }).compile()

        service = module.get<UsersService>(UsersService)
        jwtService = module.get<JwtService>(JwtService)
        requestContextService = module.get<RequestContextService>(RequestContextService)
        userModel = module.get(getModelToken(User.name))

        userModel.__setMockData(null);
        jest.clearAllMocks();
    })

    describe('signUp', () => {
        it('should successfully create a new user and return success response', async () => {
            const logSpy = jest.spyOn(service['logger'], 'log');
            userModel.__setMockData(null);
            userModel.create.mockResolvedValueOnce(mockCreatedUser);
            (bcrypt.hash as jest.Mock).mockResolvedValue('mockedHashedPassword');
            (mockRequestContextService.getRequestId as jest.Mock).mockReturnValue('N/A');

            const result = await service.signUp(testCreateUserDto);

            expect(userModel.findOne).toHaveBeenCalledWith({ email: testCreateUserDto.email });

            expect(bcrypt.genSalt).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'mockedSalt');

            expect(userModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: testCreateUserDto.email,
                    passwordHash: 'mockedHashedPassword',
                })
            );

            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining(`[N/A] User ${mockCreatedUser.id} created successfully.`)
            );

            expect(result).toEqual({ message: "User created successfully", status: "success" });
        });

        it('should throw ConflictException if user with email already exists', async () => {
            const logSpy = jest.spyOn(service['logger'], 'log');
            const existingUser = { email: testCreateUserDto.email } as unknown as UserDocument;
            userModel.__setMockData(existingUser);

            await expect(service.signUp(testCreateUserDto)).rejects.toThrow(ConflictException);
            await expect(service.signUp(testCreateUserDto)).rejects.toThrow('User exists');

            expect(userModel.findOne).toHaveBeenCalled();
            expect(bcrypt.genSalt).not.toHaveBeenCalled();
            expect(userModel.create).not.toHaveBeenCalled();

            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining(`[N/A] User with ${testCreateUserDto.email} exists.`)
            );
        });
    });

    describe('login', () => {
        it('should successfully log in and return an access token', async () => {
            const logSpy = jest.spyOn(service['logger'], 'log');

            (mockRequestContextService.getRequestId as jest.Mock).mockReturnValue('N/A');
            userModel.__setMockData(mockExistingUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (mockJwtService.sign as jest.Mock).mockReturnValue('mockedAccessToken');
            (mockSuccessResponse as jest.Mock).mockReturnValue({
                status: 'success',
                message: 'Authentication Successful',
                data: { accessToken: 'mockedAccessToken' }
            });

            const result = await service.login(testLoginUserDto);

            expect(userModel.findOne).toHaveBeenCalledWith({ email: testLoginUserDto.email });

            expect(bcrypt.compare).toHaveBeenCalledWith(
                testLoginUserDto.password,
                mockExistingUser.passwordHash
            );

            expect(mockJwtService.sign).toHaveBeenCalledWith(
                { sub: mockExistingUser.id, role: 'guest', tier: 'PAID' },
                { expiresIn: '7d' }
            );

            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining(`[N/A] Login attempt successful.`)
            );

            expect(result).toEqual({
                status: 'success',
                message: 'Authentication Successful',
                data: { accessToken: 'mockedAccessToken' }
            });
        });

        it('should throw NotFoundException if user does not exist', async () => {
            const logSpy = jest.spyOn(service['logger'], 'log');

            (mockRequestContextService.getRequestId as jest.Mock).mockReturnValue('N/A');
            userModel.__setMockData(null);

            await expect(service.login(testLoginUserDto)).rejects.toThrow(NotFoundException);

            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining(`[N/A] Login attempt: ${testLoginUserDto.email} doesn't exist.`)
            );

            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(mockJwtService.sign).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException if password is incorrect', async () => {
            const logSpy = jest.spyOn(service['logger'], 'log');

            (mockRequestContextService.getRequestId as jest.Mock).mockReturnValue('N/A');
            userModel.__setMockData(mockExistingUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(testLoginUserDto)).rejects.toThrow(UnauthorizedException);

            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining(`[N/A] ${testLoginUserDto.email} Login attempt: Incorrect password.`)
            );

            expect(bcrypt.compare).toHaveBeenCalled();
            expect(mockJwtService.sign).not.toHaveBeenCalled();
        });
    });
})