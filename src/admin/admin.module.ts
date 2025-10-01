import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './providers/admin.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './providers/admin-auth.service';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';
import { JwtModule } from '@nestjs/jwt'
import { SendMailProvider } from './providers/send-mail.provider';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, AdminAuthService, SendMailProvider],
})
export class AdminModule { }
