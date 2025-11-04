import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { successResponse } from '../../utils/res-util';
import { SendMailProvider } from './send-mail.provider';
import { type SendEmailPayload } from '../events/send-email.interface';
import { RequestContextService } from '../../tracing/request-context.service';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name)

    private magicTokens = new Map<string, { email: string; expiresAt: Date }>();

    constructor(
        private readonly requestContext: RequestContextService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly eventEmitter: EventEmitter2,

        private readonly sendMailProvider: SendMailProvider
    ) {
        setInterval(() => this.cleanupExpiredTokens(), 10 * 60 * 1000);
    }

    async sendMagicLink(email: string) {
        const requestId = this.requestContext.getRequestId() || 'N/A';
        const adminEmail = this.configService.get('appConfig.adminEmail');

        if (email !== adminEmail) {
            this.logger.log(`[${requestId}] Admin login attempt for ${email} failed.`)
            throw new UnauthorizedException('Unauthorized email');
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        this.magicTokens.set(token, { email, expiresAt });
        this.logger.log(`[${requestId}] Token generation for ${email} successful.`)

        this.eventEmitter.emit('send.email', { email, token, requestId } as SendEmailPayload)
        this.logger.log(`[${requestId}] send.email event emitted for ${email}.`)

        return successResponse({ message: 'Authentication link has been sent to your email address' });
    }

    async verifyMagicLink(token: string) {
        const requestId = this.requestContext.getRequestId() || 'N/A';
        const tokenData = this.magicTokens.get(token);

        if (!tokenData) {
            this.logger.log(`[${requestId}] Token invalid`)
            throw new UnauthorizedException('Invalid token');
        }

        if (new Date() > tokenData.expiresAt) {
            this.logger.log(`[${requestId}] Token expired.`)
            this.magicTokens.delete(token);
            throw new UnauthorizedException('Token expired');
        }

        this.magicTokens.delete(token);

        const accessToken = this.jwtService.sign(
            { email: tokenData.email, role: 'admin' },
            { expiresIn: '7d' },
        );
        this.logger.log(`[${requestId}] Access Token generated for admin.`)

        return successResponse({ message: 'Authentication Successful', data: { accessToken } });
    }


    private cleanupExpiredTokens() {
        const now = new Date();
        for (const [token, data] of this.magicTokens.entries()) {
            if (now > data.expiresAt) {
                this.magicTokens.delete(token);
            }
        }
    }


    /**
     * Handle all emitted events below
     */
    @OnEvent('send.email')
    async handleSendEmailEvent(payload: SendEmailPayload) {
        this.sendMailProvider.sendEmail(payload.email, payload.token, payload.requestId)
    }
}
