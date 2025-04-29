require('dotenv').config();

const Admin = require('../models/Admin');
const User = require('../models/User');
const Account = require('../models/Account')

const logger = require('../utils/logManager');
const auditLogger = logger.get('audit');
const adminAuthLogger = logger.get('admin-auth');
const adminActionsLogger = logger.get('admin-actions');
const accountOperationsLogger = logger.get('account-operations');

const tempPasswordGenerator = require('../utils/generateRandomString');
const censorString = require('../utils/censorString');
const { accountService, emailService } = require('../container');
const { StatusCodes } = require('http-status-codes');

const {
    BadRequestError,
    ForbiddenError,
    UnauthenticatedError,
    InternalServerError,
    NotFoundError
} = require('../outcomes/errors');

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

    adminActionsLogger.info({
        action: 'USER_ACCOUNT_CREATED',
        adminId: req.user.userId,
        accountNumber: await censorString(account.accountNumber, 11),
        accountHolderId: account.accountHolderId
    });

    auditLogger.info({
        action: 'USER_ACCOUNT_CREATED',
        adminId: req.user.userId,
        accountNumber: await censorString(account.accountNumber, 11),
        accountHolderId: account.accountHolderId
    })

    
    accountOperationsLogger.info({
        action: 'ACCOUNT_CREATED',
        accountNumber: await censorString(account.accountNumber, 11),
        accountHolderId: account.accountHolderId,
        accountType: account.accountType,
        initialBalance: account.balance
    });

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

        auditLogger.info({
            action: 'TEMP_PASSWORD_GENERATED',
            message: 'Temporary password generated successfully',
            userId: user._id,
            adminId: req.user.userId
        });
        await emailService.sendEmail(user.email, 'Temporary Password', `Your temporary password is: ${tempPassword}`);
    }
    
    if(req.body['security.status']) { 
        await user.resetLoginAttempts(); 
        auditLogger.info({
            action: 'USER_STATUS_CHANGE',
            userId: user._id,
            newStatus: req.body['security.status'],
            adminId: req.user.userId
        });
    }

    adminActionsLogger.info({
        action: 'USER_PROFILE_UPDATED',
        adminId: req.user.userId,
        userId: user._id,
        updatedFields: Object.keys(req.body)
    });

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
            auditLogger.warn({
                action: 'UNAUTHORIZED_BALANCE_UPDATE_ATTEMPT',
                adminId: req.user.userId,
                accountNumber: await censorString(req.body.accountNumber, 11)
            });
            throw new ForbiddenError('Insufficient permissions to update balance (requires superadmin)');
        }
        if (req.body.accountHolderId) {
            delete req.body.accountHolderId;
            auditLogger.warn({
                action: 'UNAUTHORIZED_ACCOUNT_HOLDER_CHANGE_ATTEMPT',
                adminId: req.user.userId,
                accountNumber: await censorString(req.body.accountNumber, 11)
            });
            throw new ForbiddenError('Insufficient permissions to update accountHolderId (requires superadmin)');
        }
    }

    const account = await accountService.updateUserAccount(req.body);
    if (!account) throw new InternalServerError('Couldn\'t update account');
    
    accountOperationsLogger.info({
        action: 'ACCOUNT_UPDATED',
        accountNumber: await censorString(account.accountNumber, 11),
        updatedFields: Object.keys(req.body),
        modifiedBy: req.user.userId
    });

    const accountObject = account.toObject();
    if (req.user.role === 'superadmin' && req.body.balance) {
        adminActionsLogger.info({
            action: 'BALANCE_ADJUSTMENT',
            adminId: req.user.userId,
            accountNumber: await censorString(account.accountNumber, 11),
            newBalance: req.body.balance
        });
    }
    // Removing sensitive data from the account object
    ['balance', 'accountHolderId'].forEach(field => delete accountObject[field]);

    adminActionsLogger.info({
        action: 'ACCOUNT_UPDATE',
        adminId: req.user.userId,
        accountNumber: await censorString(account.accountNumber, 11),
        updatedFields: Object.keys(req.body)
    });

    res.status(StatusCodes.OK).json({
        message: 'User account has been updated successfully',
        results: accountObject,
        success: true
    });
}


// Admin Auth Controllers
const createAdminAccount = async (req, res) => {
    const userId = req?.user?.userId;
    const clientIp = req.clientIp || 'Unknown';
    if (!userId) throw new UnauthenticatedError('Authentication required, Access denied');

    const { error } = createAdminSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    const admin = await Admin.create({ ...req.body, createdBy: userId });
    if (!admin) throw new InternalServerError('Couldn\'t create admin');

    adminActionsLogger.info({
        action: 'ADMIN_CREATED',
        creatorId: userId,
        newAdminId: admin._id,
        employeeId: admin.employeeId,
        role: admin.role
    });
    
    auditLogger.info({
        action: 'PRIVILEGED_ACCOUNT_CREATED',
        adminId: userId,
        newAdminRole: admin.role
    });

    const token = await admin.createAdminJWT(clientIp);
    if (!token) throw new InternalServerError('Couldn\'t create token for admin account.');
    adminAuthLogger.info({ action: 'JWT_CREATED', adminId: userObject._id, clientIp });

    res.status(StatusCodes.CREATED).json({
        message: 'Admin account successfully created.',
        results: token,
        success: true
    });
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

    adminActionsLogger.info({
        action: 'ADMIN_UPDATED',
        adminId: userId,
        targetAdminId: admin._id,
        updatedFields: Object.keys(req.body)
    });

    if (req.body['security.status']) {
        auditLogger.info({
            action: 'ADMIN_STATUS_CHANGE',
            adminId: userId,
            targetAdminId: admin._id,
            newStatus: req.body['security.status']
        });
    }

    if (req.body['security.status'] === 'active') await admin.resetLoginAttempts();

    res.status(StatusCodes.OK).json({ 
        message: 'Admin updated successfully.', 
        results: { admin },
        success: true
    })
}

const adminLogin = async (req, res) => {
    const clientIp = req.clientIp || 'Unknown';
    const { error } = adminLoginSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    const { employeeId, email, password } = req.body;
    const admin = await Admin.findOne({ employeeId, email }).select('+password');
    if (!admin) {
        adminAuthLogger.warn({
            action: 'LOGIN_ATTEMPT_FAILED',
            employeeId,
            clientIp: clientIp,
            reason: 'Invalid credentials (employeeId/email)'
        });
        // Next line for security: Fixing time-based email enumeration
        await new Promise(resolve => setTimeout(resolve, LOGIN_PROCESS_GAP_DELAY));
        throw new UnauthenticatedError('Invalid authentication credentials provided.')
    };
    const adminStatus = await admin.loginAttempt();

    
    const passMatch = await admin.comparePasswords(password);
    if (!passMatch) {
        adminAuthLogger.warn({
            action: 'LOGIN_ATTEMPT_FAILED',
            employeeId,
            clientIp: clientIp,
            adminId: admin._id,
            reason: 'Invalid password'
        });
        throw new UnauthenticatedError('Invalid authentication credentials provided.');
    }

    if (adminStatus === 'pending') {
        adminAuthLogger.warn({
            action: 'LOGIN_ATTEMPT_BLOCKED',
            employeeId,
            clientIp: clientIp,
            reason: 'Trying to login to pending account'
        });
        throw new ForbiddenError('Your admin privileges are pending approval. Contact a manager for activation.');
    }
    if (adminStatus === 'locked') {
        adminAuthLogger.warn({
            action: 'LOGIN_ATTEMPT_BLOCKED',
            employeeId,
            clientIp: clientIp,
            reason: 'Trying to login to locked account'
        });
        throw new ForbiddenError('Your admin account is temporarily locked. Contact your manager');
    }
    if (adminStatus !== 'active') {
        throw new InternalServerError('Something went wrong, Please try again later.');
    }
    
    adminAuthLogger.info({
        action: 'LOGIN_SUCCESS',
        adminId: admin._id,
        employeeId,
        clientIp: clientIp
    });

    await admin.resetLoginAttempts();
    const token = await admin.createAdminJWT(clientIp);
    if (!token) throw new InternalServerError('Couldn\'t create token for admin account.');
    adminAuthLogger.info({ action: 'JWT_CREATED', adminId: admin._id, clientIp });

    res.status(StatusCodes.OK).json({
        message: 'Admin logged in successfully.',
        results: {
            token
        },
        success: true
    });
}


module.exports = {
    createAdminAccount,
    updateUserData,
    updateUserAccount,
    updateAdminAccount,
    adminLogin,
    createUserAccount,
}