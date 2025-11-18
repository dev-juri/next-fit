export interface MockMongooseQuery<T> {
    sort: jest.Mock;
    skip: jest.Mock;
    limit: jest.Mock;
    select: jest.Mock;
    populate: jest.Mock;
    lean: jest.Mock;
    where: jest.Mock;
    exec: jest.Mock<Promise<T | T[] | null>>;
    then: (resolve: (value: T | T[] | null) => void, reject: (reason: any) => void) => Promise<any>;
    catch: (reject: (reason: any) => void) => Promise<any>;
    [key: string]: any;
}

export interface MockMongooseModel<T> {
    __setMockData: (newData: T | T[] | null) => void;
    __queryMock: MockMongooseQuery<T>;

    find: jest.Mock<MockMongooseQuery<T>>;
    findOne: jest.Mock<MockMongooseQuery<T>>;
    findById: jest.Mock<MockMongooseQuery<T>>;
    countDocuments: jest.Mock<Promise<number>>;

    create: jest.Mock<Promise<T>>;
    insertMany: jest.Mock<Promise<T[]>>;

    updateOne: jest.Mock<Promise<{ acknowledged: boolean; modifiedCount: number }>>;
    updateMany: jest.Mock<Promise<{ acknowledged: boolean; modifiedCount: number }>>;
    deleteOne: jest.Mock<Promise<{ acknowledged: boolean; deletedCount: number }>>;
    deleteMany: jest.Mock<Promise<{ acknowledged: boolean; deletedCount: number }>>;
}

const createMockMongooseModel = <T>(initialData: T | T[] | null = null): MockMongooseModel<T> => {

    let mockData = initialData;

    /**
     * The Query "Interface"
     */
    const queryMock: MockMongooseQuery<T> = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),

        exec: jest.fn().mockImplementation(() => Promise.resolve(mockData)),
        then: (resolve, reject) => Promise.resolve(mockData).then(resolve, reject),
        catch: (reject) => Promise.resolve(mockData).catch(reject),
    };

    /**
     * The Model "Interface"
     */
    return {
        // --- Helper to inject data during tests ---
        __setMockData: (newData: T | T[] | null) => {
            mockData = newData;
        },

        // --- Mongoose Static Methods ---
        find: jest.fn().mockReturnValue(queryMock),
        findOne: jest.fn().mockReturnValue(queryMock),
        findById: jest.fn().mockReturnValue(queryMock),
        countDocuments: jest.fn().mockImplementation(() =>
            Promise.resolve(Array.isArray(mockData) ? mockData.length : (mockData ? 1 : 0))
        ),

        create: jest.fn().mockImplementation((data: T) => Promise.resolve(data)),
        insertMany: jest.fn().mockImplementation((data: T[]) => Promise.resolve(data)),

        updateOne: jest.fn().mockResolvedValue({ acknowledged: true, modifiedCount: 1 }),
        updateMany: jest.fn().mockResolvedValue({ acknowledged: true, modifiedCount: 1 }),
        deleteOne: jest.fn().mockResolvedValue({ acknowledged: true, deletedCount: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ acknowledged: true, deletedCount: 1 }),

        // Access to the inner query mock for assertions
        __queryMock: queryMock
    };
};

export default createMockMongooseModel;