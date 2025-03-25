const Joi = require('joi');

const { db: config } = require('../config');

const rules = {
    createUserAccountSchema: Joi.object({
        accountType: Joi.string().valid(...config.account.ACCOUNT_TYPES).required(),
        balance: Joi.number().positive().min(config.account.MINIMUM_ACCOUNT_BALANCE).max(config.account.MAXIMUM_ACCOUNT_BALANCE).required(),
        accountHolderId: Joi.string().length(24).required(),
    }),
    updateUserAccountSchema: Joi.object({
        accountNumber: Joi.string().length(config.account.ACCOUNT_NUMBER_LENGTH).required(),
        accountHolderId: Joi.string().length(24).optional(),
        status: Joi.string().valid(...config.account.ACCOUNT_STATUS).optional(),
        accountType: Joi.string().valid(...config.account.ACCOUNT_TYPES).optional(),
        balance: Joi.number().min(0).max(config.account.MAXIMUM_ACCOUNT_BALANCE).optional()
    }),
    createAdminSchema: Joi.object({
        employeeId: Joi.string().length(16).required(),
        password: Joi.string().min(config.admin.ADMIN_MIN_PASSWORD).max(config.admin.ADMIN_MAX_PASSWORD).required(),
        email: Joi.string().email({ minDomainSegments: 2 }).required(),
        role: Joi.string().valid(...config.admin.ADMIN_ROLES).optional()
    }),
    adminLoginSchema: Joi.object({
        employeeId: Joi.string().length(16).required(),
        email: Joi.string().email({ minDomainSegments: 2 }).required(),
        password: Joi.string().min(config.admin.ADMIN_MIN_PASSWORD).max(config.admin.ADMIN_MAX_PASSWORD).required()
    })
}

module.exports = rules;