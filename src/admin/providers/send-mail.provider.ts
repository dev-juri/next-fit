import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SendMailProvider {
    private readonly logger = new Logger(SendMailProvider.name)

    constructor(
        private readonly configService: ConfigService,
    ) { }

    async sendEmail(email: string, token: string, requestId: string) {
        const url = this.configService.get('FRONTEND_URL');
        const magicLink = `${url}/admin/auth/verify?token=${token}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configService.get('EMAIL_USER'),
                pass: this.configService.get('EMAIL_PASSWORD'),
            },
        });
        try {
            this.logger.log(`[${requestId}] Sending Magic URL sent to ${email}.`)
            await transporter.sendMail({
                from: this.configService.get('EMAIL_USER'),
                to: email,
                subject: 'Verify Authentication',
                html: `
        <h2>Verify Authentication</h2>
        <p>Click the link below to login to your admin dashboard:</p>
        <a href="${magicLink}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #4F46E5;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 16px 0;
        ">Login to Admin Dashboard</a>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
            });

            this.logger.log(`[${requestId}] Magic URL sent to ${email} successfully.`)

        } catch (err) {
            this.logger.error(`[${requestId}] Failed to send Magic URL to ${email}.`, err.stack)
        }
    }
}
