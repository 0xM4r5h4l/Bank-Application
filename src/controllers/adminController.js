require('dotenv').config();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../outcomes/errors');
const Account = require('../models/Account');
const Joi = require('joi');


// Admin Feautures
const createUserAccount = async (req, res) => {
    const schema = Joi.object({
        accountNumber: Joi.string().required(),
        accountType: Joi.string().required(),
        balance: Joi.number().required(),
        accountHolderId: Joi.string().required(),
    })

    const { error } = schema.validate({ ...req.body })
    if (error) {
        throw new BadRequestError(error.details[0].message);
    } 

    const account = await Account.create({ ...req.body });
    if (!account){
        throw new BadRequestError('Couldn\'t create account');
    }

    res.status(StatusCodes.CREATED).json({ account });
}


// Admin Auth Controllers
const adminRegister = async (req, res) => {}

const adminLogin = async (req, res) => {}


module.exports = {
    adminRegister,
    adminLogin,
    createUserAccount,
}