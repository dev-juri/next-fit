import { Module } from '@nestjs/common';
import { AdminService } from './providers/admin.service';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';
import { JwtModule } from '@nestjs/jwt'
import { SendMailProvider } from './providers/send-mail.provider';
import { AccessTokenGuard } from 'src/guards/access-token.guard';
import { AdminAuthGuard } from 'src/guards/admin-auth.guard';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider())
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminService, SendMailProvider, AccessTokenGuard, AdminAuthGuard],
})
export class AdminModule { }
