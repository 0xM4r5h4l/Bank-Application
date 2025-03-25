require('dotenv').config();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, ForbiddenError, UnauthenticatedError, InternalServerError } = require('../outcomes/errors');
const AccountService = require('../services/AccountService');
const Admin = require('../models/Admin');
const {
    createUserAccountSchema,
    updateUserAccountSchema,
    createAdminSchema,
    adminLoginSchema,
} = require('../validations/adminValidations');

// Admin Feautures
const createUserAccount = async (req, res) => {
    const { error } = createUserAccountSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    try {
        const account = await AccountService.createAccount(req.body);
        if (!account) throw new InternalServerError('Couldn\'t create account');
        res.status(StatusCodes.CREATED).json({ account });
    } catch(error) {
        throw new InternalServerError(error.message);
    }
}

const updateUserAccount = async (req, res) => {
    const { error } = updateUserAccountSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    if (req.user.role !== 'superadmin') {
        if (req.body.balance) {
            delete req.body.balance;
            throw new ForbiddenError('Insufficient permissions to update balance (requires superadmin)');
        }
        if (req.body.accountHolderId) {
            delete req.body.accountHolderId;
            throw new ForbiddenError('Insufficient permissions to update accountHolderId (requires superadmin)');
        }
    }

    const account = await AccountService.updateUserAccount(req.body);
    if (!account) throw new InternalServerError('Couldn\'t update account');
    res.status(StatusCodes.OK).json({ account });
}


// Admin Auth Controllers
const createAdminAccount = async (req, res) => {
    const userId = req?.user?.userId;
    if (!userId) throw new UnauthenticatedError('Authentication required, Access denied');

    const { error } = createAdminSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    const admin = await Admin.create({ ...req.body, createdBy: userId });
    if (!admin) throw new InternalServerError('Couldn\'t create admin');

    const token = await admin.createAdminJWT();
    res.status(StatusCodes.CREATED).json({ token });
}

const adminLogin = async (req, res) => {
    const { error } = adminLoginSchema.validate();
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
    updateUserAccount,
    adminLogin,
    createUserAccount,
}