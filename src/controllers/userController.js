const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

const logger = require('../utils/logManager');
const transactionsLogger = logger.get('transactions');
const auditLogger = logger.get('audit');
const userAuthLogger = logger.get('user-auth');
const communicationsLogger = logger.get('communications');

const { StatusCodes } = require('http-status-codes');

const { userService, accountService, transactionService } = require('../container');
const censorString = require('../utils/censorString');

const {
    userRegisterSchema,
    userLoginSchema,
    userVerifyEmailSchema,
    getAccountBalanceSchema,
    createTransferSchema,
    getTransferHistorySchema
} = require('../validations/user/userValidations');

const {
    BadRequestError,
    UnauthenticatedError,
    NotFoundError,
    InternalServerError,
    UnprocessableEntityError
} = require('../outcomes/errors');

const LOGIN_PROCESS_GAP_DELAY = process.env.LOGIN_PROCESS_GAP_DELAY;

// User Auth Controllers
const userRegister = async (req, res) => {
    const { error } = userRegisterSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    const clientIp = req.clientIp || 'Unknown';
    const { user, token } = await userService.userRegister(req.body, clientIp);
    const userObject = user.toObject();

    userAuthLogger.info({ action: 'JWT_CREATED', userId: userObject._id, clientIp });
    auditLogger.info({ action: 'EMAIL_VERIFICATION_TOKEN_CREATED', userId: userObject._id, clientIp });
    communicationsLogger.info({ action: 'EMAIL_VERIFICATION_SENT', via: 'email', userId: userObject._id, deliveryStatus: 'success' });
    auditLogger.info({ action: 'USER_CREATED', userId: userObject._id, clientIp });
    
    res.status(StatusCodes.CREATED).json({
        message: 'User registered successfully.',
        results: {
            firstName: userObject.firstName,
            token: token
        },
        success: true
    });
}

const userVerifyEmail = async (req, res) => {
    const { token } = req.params;
    const { error } = userVerifyEmailSchema.validate({ token });
    if (error) throw new BadRequestError(error.details[0].message);

    const clientIp = req.clientIp || 'Unknown';
    const userVerify = await userService.verifyEmail(token);

    auditLogger.info({ action: 'EMAIL_VERIFICATION_SUCCESSFUL', userId: userVerify._id, clientIp });
    res.status(StatusCodes.OK).json({
        message: 'Email verified successfully, you can now login.',
        results: [],
        success: true
    });
}

const userResendVerification = async (req, res) => {
    const { userId } = req.user;
    if (!userId) throw new UnauthenticatedError('Authentication required, Access denied.');

    const clientIp = req.clientIp || 'Unknown';
    const { action, user } = await userService.userResendVerification(userId);
    const userObject = user.toObject();
    
    auditLogger.info({ action, userId: userObject._id, clientIp });
    communicationsLogger.info({ action: 'EMAIL_VERIFICATION_RESENT', via: 'email', userId: userObject._id, deliveryStatus: 'success' });
    
    res.status(StatusCodes.OK).json({
        message: 'Email verification resent successfully.',
        results: [],
        success: true
    })
}

const userLogin = async (req, res) => {
    let warning = [];
    const { error } = userLoginSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);
    
    const clientIp = req.clientIp || 'Unknown';
    const { email, password } = req.body;
    const { user, token, userStatus } = await userService.userLogin({ email, password }, clientIp, LOGIN_PROCESS_GAP_DELAY);
    if (userStatus == 'pending') warning.push('Account pending. It needs verification.');
    if (userStatus !== 'active' && userStatus !== 'pending') warning.push('Account restricted. Contact bank customer service.');

    const userObject = user.toObject();
    userAuthLogger.info({ action: 'USER_LOGIN_ATTEMPT', userId: userObject._id, clientIp });
    userAuthLogger.info({ action: 'JWT_CREATED', userId: userObject._id, clientIp });

    res.status(StatusCodes.OK).json({
        message: 'User logged in successfully.',
        results: {
            firstName: user.firstName,
            token: token
        },
        warning,
        success: true
    })
}

// User Features Controllers
const getUserAccounts = async (req, res) => {
    const userId = req.user.userId;
    if (!userId) throw new UnauthenticatedError('Authentication required, Access denied.');

    const userAccounts = await accountService.getUserAccounts(userId);

    res.status(StatusCodes.OK).json({
        message: 'Accounts retrieved successfully',
        results: {
            accounts: userAccounts
        },
        success: true
    });
}

const getAccountBalance = async (req, res) => {
    const { accountNumber } = req?.params;
    const userId  = req?.user?.userId;
    if (!userId) throw new UnauthenticatedError('Authentication required, Access denied.');
    
    const { error } = getAccountBalanceSchema.validate({ accountNumber });
    if (error) throw new BadRequestError(error.details[0].message);
    
    const balance = await accountService.getAccountBalance(accountNumber, userId);
    
    res.status(StatusCodes.OK).json({
        message: 'Account balance retrieved successfully.',
        results: {
            balance: balance
        },
        success: true
    });
}

const createTransfer = async (req, res) => {
    const userId = req?.user?.userId;
    if (!userId) throw new UnauthenticatedError('Authentication required, Access denied.');
    
    const { error } = createTransferSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);
    
    const account = await Account.findOne({ accountNumber: req.body.accountNumber, accountHolderId: userId })
    .select('accountNumber')
    .lean();
    if (!account) throw new NotFoundError('Invalid account number.');

    const { error: transactionError, success } = await transactionService.doTransfer(req.body);
    if (transactionError || !success) {
        const { recordSuccess } = await transactionService.recordTransaction(req.body, 'failed', 'transfer', transactionError.message);
        if (!recordSuccess) {
            transactionsLogger.error({ action: 'TRANSACTION_RECORD_FAILED', message: 'Transaction record failed.' });
            auditLogger.error({ action: 'TRANSACTION_RECORD_FAILED', message: 'Transaction record failed.' });
        }

        transactionsLogger.error({ action: 'TRANSFER_FAILED', message: transactionError.message });
        auditLogger.error({ action: 'TRANSFER_FAILED', message: transactionError.message });
        if (transactionError.unprocessableEntityError) {
            throw new UnprocessableEntityError(transactionError.message);
        }

        throw new InternalServerError(transactionError.message);
    }
    
    const { recordSuccess } = await transactionService.recordTransaction(req.body, 'successful', 'transfer', null);
    if (!recordSuccess) {
        transactionsLogger.error({ action: 'TRANSACTION_RECORD_FAILED', message: 'Transaction record failed.' });
        auditLogger.error({ action: 'TRANSACTION_RECORD_FAILED', message: 'Transaction record failed.' });
    }

    transactionsLogger.info({ action: 'TRANSFER_SUCCESSFUL', message: 'Transfer created successfully.' });
    auditLogger.info({ action: 'TRANSFER_SUCCESSFUL', message: 'Transfer created successfully.' });

    res.status(StatusCodes.CREATED).json({ message: 'Transfer created successfully', results: {}, success: true });
}

const getTransactionsHistory = async (req, res) => {
    const { userId } = req.user;
    if (!userId) throw new UnauthenticatedError('Authentication required, Access denied.');

    const { error } = getTransferHistorySchema.validate(req.params);
    if (error) throw new BadRequestError(error.details[0].message);

    const { accountNumber } = req.params;
    const account = await Account.findOne({ accountNumber, accountHolderId: userId })
    .select('accountNumber')
    .lean();
    if (!account) throw new NotFoundError('Account not found.');

    const transactions = await Transaction.find({ $or: [{ accountNumber: account.accountNumber }, { toAccount: account.accountNumber }] })
    .select({
        _id: 0,
        accountNumber: 1,
        transactionType: 1,
        amount: 1,
        status: 1,
        toAccount: 1,
        transactionDate: { 
            $dateToString: {
                format: "%Y-%m-%d %H:%M",
                date: "$transactionDate",
                timezone: "Africa/Cairo"
            }
        }
    })
    .limit(20)
    .lean();

    if (!transactions) {
        return res.status(StatusCodes.OK).json({
            message: 'No transactions found.',
            results: [],
            success: true
        })
    }

    const censoredTransactions = transactions.map(transaction => ({
        ...transaction,
        accountNumber: censorString(transaction.accountNumber, (transaction.accountNumber.length - 4)),
        toAccount: censorString(transaction.toAccount, (transaction.toAccount.length - 4))
    }));

    res.status(StatusCodes.OK).json({
        message: "Transactions retrieved successfully.",
        results: censoredTransactions,
        success: true
    })
}


module.exports = { 
    getUserAccounts,
    getAccountBalance, 
    getTransactionsHistory,
    createTransfer,
    userRegister,
    userLogin,
    userVerifyEmail,
    userResendVerification
}