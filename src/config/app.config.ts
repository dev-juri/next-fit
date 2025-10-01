import { registerAs } from "@nestjs/config";

export default registerAs('appConfig', () => ({
    port: process.env.PORT,
    adminEmail: process.env.ADMIN_EMAIL,
    frontendUrl: process.env.FRONTEND_URL,
    emailUser: process.env.EMAIL_USER,
    emailPassword: process.env.EMAIL_PASSWORD
}));