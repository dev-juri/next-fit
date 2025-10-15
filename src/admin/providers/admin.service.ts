import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { successResponse } from '../../utils/res-util';
import { SendMailProvider } from './send-mail.provider';
import { type SendEmailPayload } from '../events/send-email.interface';

@Injectable()
export class AdminService {
    private magicTokens = new Map<string, { email: string; expiresAt: Date }>();

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly eventEmitter: EventEmitter2,

        private readonly sendMailProvider: SendMailProvider
    ) {
        setInterval(() => this.cleanupExpiredTokens(), 10 * 60 * 1000);
    }

    async sendMagicLink(email: string) {
        const adminEmail = this.configService.get('appConfig.adminEmail');

        if (email !== adminEmail) {
            throw new UnauthorizedException('Unauthorized email');
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        this.magicTokens.set(token, { email, expiresAt });

        this.eventEmitter.emit('send.email', { email, token } as SendEmailPayload)

        return successResponse({ message: 'Authentication link has been sent to your email address' });
    }

    async verifyMagicLink(token: string) {
        const tokenData = this.magicTokens.get(token);

        if (!tokenData) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        if (new Date() > tokenData.expiresAt) {
            this.magicTokens.delete(token);
            throw new UnauthorizedException('Token expired');
        }

        this.magicTokens.delete(token);

        const accessToken = this.jwtService.sign(
            { email: tokenData.email, role: 'admin' },
            { expiresIn: '7d' },
        );

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
        console.log(payload)
        this.sendMailProvider.sendEmail(payload.email, payload.token)
    }
}
