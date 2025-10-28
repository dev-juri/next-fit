import { SetMetadata } from '@nestjs/common';
import { AuthType } from '../utils/auth-type.enum';
import { ADMIN_AUTH_TYPE_KEY, USER_AUTH_TYPE_KEY } from '../utils/constants';

export const AdminAuth = (...authTypes: AuthType[]) => SetMetadata(ADMIN_AUTH_TYPE_KEY, authTypes);

export const UserAuth = (...authTypes: AuthType[]) => SetMetadata(USER_AUTH_TYPE_KEY, authTypes);
