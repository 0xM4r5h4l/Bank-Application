require('dotenv').config();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, ForbiddenError, UnauthenticatedError, InternalServerError, NotFoundError } = require('../outcomes/errors');
const AccountService = require('../services/AccountService');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Account = require('../models/Account')
const EmailService = require('../services/EmailService');
const generateTempPassword = require('../utils/generateTempPassword');
const {
    createUserAccountSchema,
    updateUserAccountSchema,
    updateUserDataSchema,
    createAdminSchema,
    adminLoginSchema,
} = require('../validations/admin/adminValidations');

// Admin Feautures
const createUserAccount = async (req, res) => {
    req.body.createdBy = req.user.userId;
    const { error } = createUserAccountSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    const account = await AccountService.createAccount(req.body);
    if (!account) throw new InternalServerError('Couldn\'t create account');
    res.status(StatusCodes.CREATED).json({
            message: 'User account successfully created.',
            results: {
                account
            },
            success: true
    });
}

const updateUserData = async (req, res) => {
    /*
        + Takes admin id (userId)
        + Take data from req.body & checking (Joi Schema)
        + Find accountNumber (Account)
            + if exists get the accountHolderId
            - if doesn't exist return NotFoundError
        + Find and update the User with userId(accountHolderId)
    */
    let tempPasswordRequest = false;
    const { error } = updateUserDataSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);
    
    req.body.updatedBy = req.user.userId;

    if (req.body.tempPasswordRequest) {
        tempPasswordRequest = req.body.tempPasswordRequest;
        delete req.body.tempPasswordRequest;
    }
    
    if (req.body.status) {
        req.body.security = { status: req.body.status };
        delete req.body.status;
    }

    const account = await Account.findOne({ accountNumber: req.body.accountNumber })
    if (!account) throw new NotFoundError('Account not found.');

    
    const user = await User.findOneAndUpdate(
        { _id: account.accountHolderId },
        { ...req.body },
        { new: true }
    );
    if (!user) throw new NotFoundError('Account found, but user is not found.');
    
    if (tempPasswordRequest) {
        const tempPassword = await generateTempPassword();
        if (tempPassword.error) throw new InternalServerError('Error generating temporary password');
        user.password = tempPassword;
        await user.save();
        EmailService.sendEmail(user.email, 'Temporary Password', `Your temporary password is: ${tempPassword}`);
    }
    
    res.status(StatusCodes.OK).json({
        message: 'User updated successfully.',
        results: user,
        success: true
    });
}

const updateUserAccount = async (req, res) => {
    req.body.updatedBy = req.user.userId;
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
    res.status(StatusCodes.OK).json({
        message: 'User account has been updated successfully',
        results: account,
        success: true
    });
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
    res.status(StatusCodes.CREATED).json({ message: 'Admin account successfully created.', results: token, success: true });
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
    res.status(StatusCodes.OK).json({ message: 'Admin logged in successfully.', results: { token }, success: true });
}


module.exports = {
    createAdminAccount,
    updateUserData,
    updateUserAccount,
    adminLogin,
    createUserAccount,
}