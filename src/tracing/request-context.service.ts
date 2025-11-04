import { Injectable } from '@nestjs/common';
import { asyncLocalStorage } from './async-local-storage';

@Injectable()
export class RequestContextService {

    getRequestId(): string | undefined {
        const store = asyncLocalStorage.getStore();
        return store?.requestId;
    }
}
