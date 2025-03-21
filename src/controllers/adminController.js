require('dotenv').config();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, ForbiddenError, UnauthenticatedError } = require('../outcomes/errors');
const Joi = require('joi');
const AccountService = require('../services/AccountService');
const Admin = require('../models/Admin');

// Admin Feautures
const createUserAccount = async (req, res) => {
    const schema = Joi.object({
        accountType: Joi.string().required(),
        balance: Joi.number().required(),
        accountHolderId: Joi.string().required(),
    });

    const { error } = schema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    try {
        const account = await AccountService.createAccount(req.body);

        if (!account) throw new BadRequestError('Couldn\'t create account')

        res.status(StatusCodes.CREATED).json({ account });
    } catch(error) {
        throw new BadRequestError('Account generation failed, after reaching max_attempts');
    }
}


// Admin Auth Controllers
const createAdminAccount = async (req, res) => {
    const userId = req?.user?.userId;
    if (!userId) throw new UnauthenticatedError('Authentication required, Access denied');
    
    const schema = Joi.object({
        employeeId: Joi.string().length(16),
        password: Joi.string().min(12).max(128),
        email: Joi.string().min(6).max(128),
    });

    const { error } = schema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    const admin = await Admin.create({ ...req.body, createdBy: userId });
    if (!admin) throw new BadRequestError('Couldn\'t create admin');

    const token = await admin.createAdminJWT();
    res.status(StatusCodes.CREATED).json({ token });
}

const adminLogin = async (req, res) => {
    const schema = Joi.object({
        employeeId: Joi.string().length(16),
        email: Joi.string().min(6).max(128),
        password: Joi.string().max(128)
    });
    
    const { error } = schema.validate();
    if (error) throw new BadRequestError(error.details[0].message);

    const { employeeId, email, password } = req.body;
    const admin = await Admin.findOne({ employeeId, email }).select('+password');
    if (!admin) throw new UnauthenticatedError('Invalid authentication credentials provided.');

    const passMatch = await admin.comparePasswords(password);
    if (!passMatch) throw new UnauthenticatedError('Invalid authentication credentials provided.');

    const token = await admin.createAdminJWT(req.clientIp);

    res.status(StatusCodes.OK).json({ token });
}


module.exports = {
    createAdminAccount,
    adminLogin,
    createUserAccount,
}