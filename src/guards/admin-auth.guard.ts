import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthType } from '../utils/auth-type.enum';
import { AccessTokenGuard } from './access-token.guard';
import { Reflector } from '@nestjs/core';
import { ADMIN_AUTH_TYPE_KEY, REQUEST_ADMIN_KEY } from '../utils/constants';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  private static readonly defaultAuthType = AuthType.Bearer;

  private readonly authTypeGuideMap: Record<AuthType, CanActivate | CanActivate[]>

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard
  ) {
    this.authTypeGuideMap = {
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.None]: { canActivate: () => true },
    };
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    // get authTypes from reflector
    const authTypes = this.reflector.getAllAndOverride(ADMIN_AUTH_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [AdminAuthGuard.defaultAuthType];

    // create array of all the guards
    const guards = authTypes.map((type) => this.authTypeGuideMap[type]).flat();

    // Default error
    const error = new UnauthorizedException();

    // loop through guards, fire canActivate
    for (const instance of guards) {
      try {
        const canActivate = await instance.canActivate(context);
        if (!canActivate) {
          throw new UnauthorizedException();
        }
      } catch (err) {
        throw err;
      }
    }

    if (authTypes && authTypes.includes(AuthType.None)) {
      return true
    }

    const request = context.switchToHttp().getRequest();
    if (!request[REQUEST_ADMIN_KEY]) {
      return false
    }

    return true;
  }
}
