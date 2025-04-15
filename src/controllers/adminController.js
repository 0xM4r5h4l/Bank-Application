require('dotenv').config();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, ForbiddenError, UnauthenticatedError, InternalServerError, NotFoundError } = require('../outcomes/errors');
const AccountService = require('../services/AccountService');
const accountService = new AccountService();
const Admin = require('../models/Admin');
const User = require('../models/User');
const Account = require('../models/Account')
const EmailService = require('../services/EmailService');
const emailService = new EmailService(process.env.DOMAIN);
const tempPasswordGenerator = require('../utils/generateRandomString');
const {
    createUserAccountSchema,
    updateUserAccountSchema,
    updateUserDataSchema,
    createAdminSchema,
    updateAdminAccountSchema,
    adminLoginSchema,
} = require('../validations/admin/adminValidations');

const LOGIN_PROCESS_GAP_DELAY = process.env.LOGIN_PROCESS_GAP_DELAY;

// Admin Feautures
const createUserAccount = async (req, res) => {
    req.body.createdBy = req.user.userId;
    const { error } = createUserAccountSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    const account = await accountService.createAccount(req.body);
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
    let tempPasswordRequest = false;
    const { error } = updateUserDataSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);
    
    req.body.updatedBy = req.user.userId;

    if (req.body.tempPasswordRequest) {
        tempPasswordRequest = req.body.tempPasswordRequest;
        delete req.body.tempPasswordRequest;
    }
    
    if (req.body.status) {
        req.body['security.status'] = req.body.status;
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
        const tempPassword = await tempPasswordGenerator(16);
        if (tempPassword.error) throw new InternalServerError('Error generating temporary password');
        user.password = tempPassword;
        await user.save();
        EmailService.sendEmail(user.email, 'Temporary Password', `Your temporary password is: ${tempPassword}`);
    }
    
    if(req.body['security.status']) await user.resetLoginAttempts();
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

    const account = await accountService.updateUserAccount(req.body);
    if (!account) throw new InternalServerError('Couldn\'t update account');
    const accountObject = account.toObject();
    // Removing sensitive data from the account object
    ['balance', 'accountHolderId'].forEach(field => delete accountObject[field]);

    res.status(StatusCodes.OK).json({
        message: 'User account has been updated successfully',
        results: accountObject,
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

    const token = await admin.createAdminJWT(req.clientIp);
    res.status(StatusCodes.CREATED).json({ message: 'Admin account successfully created.', results: token, success: true });
}

const updateAdminAccount = async (req, res) => {
    const userId = req?.user?.userId;
    if (!userId) throw new UnauthenticatedError('Authentication required, Access denied');
    
    const { error } = updateAdminAccountSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    if (req.body.status) {
        req.body['security.status'] = req.body.status;
        delete req.body.status;
    }

    req.body.updatedBy = userId;
    const admin = await Admin.findOneAndUpdate(
        { employeeId: req.body.employeeId }, 
        { ...req.body },
        { new: true }
    )
    if (!admin) throw new NotFoundError('Couldn\'t find any employee with this employeeId.');

    if (req.body['security.status'] === 'active') await admin.resetLoginAttempts();
    res.status(StatusCodes.OK).json({ 
        message: 'Admin updated successfully.', 
        results: { admin },
        success: true
    })
}

const adminLogin = async (req, res) => {
    const { error } = adminLoginSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    const { employeeId, email, password } = req.body;
    const admin = await Admin.findOne({ employeeId, email }).select('+password');
    if (!admin) {
        // Next line for security: Fixing time-based email enumeration
        await new Promise(resolve => setTimeout(resolve, LOGIN_PROCESS_GAP_DELAY));
        throw new UnauthenticatedError('Invalid authentication credentials provided.')
    };
    const adminStatus = await admin.loginAttempt();

    
    const passMatch = await admin.comparePasswords(password);
    if (!passMatch) throw new UnauthenticatedError('Invalid authentication credentials provided.');

    if (adminStatus === 'pending') {
        throw new ForbiddenError('Your admin privileges are pending approval. Contact a manager for activation.');
    }
    if (adminStatus === 'locked') {
        throw new ForbiddenError('Your admin account is temporarily locked. Contact your manager');
    }
    if (adminStatus !== 'active') {
        throw new InternalServerError('Something went wrong, Please try again later.');
    }
    
    await admin.resetLoginAttempts();
    const token = await admin.createAdminJWT(req.clientIp);
    res.status(StatusCodes.OK).json({ message: 'Admin logged in successfully.', results: { token }, success: true });
}


module.exports = {
    createAdminAccount,
    updateUserData,
    updateUserAccount,
    updateAdminAccount,
    adminLogin,
    createUserAccount,
}