import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { Request } from 'express';
import { LIMITS } from 'src/jobs/utils/rate-limit-utils';
import { CURRENT_USAGE_KEY, MAX_LIMIT, RATE_LIMIT_KEY } from 'src/utils/constants';
import { AccessTokenGuard } from './access-token.guard';

interface AuthUser {
    sub: string;
    tier: 'FREE' | 'PAID';
}

@Injectable()
export class JobLimitGuard implements CanActivate {

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly accessTokenGuard: AccessTokenGuard
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            await this.accessTokenGuard.canActivate(context)
        } catch (error) { }

        const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
        const user = request.user;

        let key: string;
        let maxLimit: number;

        if (user && user.sub) {
            key = `job_count:user:${user.sub}`;
            // TODO: Check if user has subscribed or not to determine whether free or paid
            maxLimit = LIMITS.PAID;
        } else {
            key = `job_count:ip:${request.ip}`;
            maxLimit = LIMITS.UNREGISTERED;
        }

        const currentUsage: number = (await this.cacheManager.get(key)) || 0;

        if (currentUsage >= maxLimit) {
            throw new ForbiddenException(
                `Rate limit exceeded. You have already fetched ${currentUsage}/${maxLimit} jobs today. Please try again tomorrow.`
            );
        }

        request[RATE_LIMIT_KEY] = key;
        request[CURRENT_USAGE_KEY] = currentUsage;
        request[MAX_LIMIT] = maxLimit

        return true;
    }
}