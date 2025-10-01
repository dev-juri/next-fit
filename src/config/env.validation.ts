import * as Joi from 'joi'

export default Joi.object({
    PORT: Joi.string().required(),
    ADMIN_EMAIL: Joi.string().email().required(),
    JWT_SECRET: Joi.string().required(),
    FRONTEND_URL: Joi.string().uri().required(),
    EMAIL_USER: Joi.string().email().required(),
    EMAIL_PASSWORD: Joi.string().required()
});