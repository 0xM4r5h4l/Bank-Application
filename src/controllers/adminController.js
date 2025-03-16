require('dotenv').config();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../outcomes/errors');
const Joi = require('joi');
const AccountService = require('../services/AccountService');

// Admin Feautures
const createUserAccount = async (req, res) => {
    const schema = Joi.object({
        accountType: Joi.string().required(),
        balance: Joi.number().required(),
        accountHolderId: Joi.string().required(),
    });

    const { error } = schema.validate({ ...req.body })
    if (error) {
        throw new BadRequestError(error.details[0].message);
    }
    try {
        const account = await AccountService.generateAccount(req.body);
        if (!account){
            throw new BadRequestError('Couldn\'t create account');
        }
        res.status(StatusCodes.CREATED).json({ account });
    } catch(error) {
        throw new BadRequestError('Account generation failed, after reaching max_attempts');
    }
}


// Admin Auth Controllers
const adminRegister = async (req, res) => {}

const adminLogin = async (req, res) => {}


module.exports = {
    adminRegister,
    adminLogin,
    createUserAccount,
}