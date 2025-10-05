import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_ADMIN_KEY } from 'src/utils/constants';

export const ActiveAdmin = createParamDecorator(
    (field: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const admin = request[REQUEST_ADMIN_KEY];

        return field ? admin?.[field] : admin;
    },
);
