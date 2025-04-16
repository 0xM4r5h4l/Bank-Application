const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

const TransactionService = require('../services/TransactionService');
const logger = require('../utils/logManager');
const transactionsLogger = logger.get('transactions');

const { TransactionError } = require('../outcomes/transactions');
const { StatusCodes } = require('http-status-codes');

const EmailService = require('../services/EmailService');
const emailService = new EmailService(process.env.DOMAIN);
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
    ForbiddenError,
    ConflictError
} = require('../outcomes/errors');

const LOGIN_PROCESS_GAP_DELAY = process.env.LOGIN_PROCESS_GAP_DELAY;

// User Auth Controllers
const userRegister = async (req, res) => {
    const { error } = userRegisterSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    const { error: err, duplicate } = await User.checkDuplicates({
        email: req.body.email,
        nationalId: req.body.nationalId,
        phoneNumber: req.body.phoneNumber
    });

    if (err) throw new InternalServerError('Error while checking duplicate');
    if (duplicate) throw new BadRequestError(`User with the same '${duplicate}' already exists`);
    
    const user = await User.create({ ...req.body });
    if (!user) throw new BadRequestError('Couldn\'t register user');
    
    const userObject = user.toObject();
    // Removing sensitive data
    ['password', 'nationalId', 'phoneNumber', 'dateOfBirth', 'address'].forEach(field => delete userObject[field]);
    
    const token = await user.createUserJWT(req.clientIp);
    if (!token) throw new InternalServerError('Error while generating token');

    const verifyToken = await user.createVerificationToken();
    if (!verifyToken) throw new InternalServerError('Error while generating verification token');

    const emailVerify = await emailService.sendVerificationEmail(userObject.email, userObject.firstName, verifyToken);
    if (!emailVerify) throw new InternalServerError('Error while sending verification email');

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

    const verify = await User.validateVerificationToken(token);
    if (!verify) throw new BadRequestError('Invalid token or token expired');

    res.status(StatusCodes.OK).json({
        message: 'Email verified successfully, you can now login.',
        results: [],
        success: true
    });
}

const userResendVerification = async (req, res) => {
    const { userId } = req.user;
    if (!userId) throw new UnauthenticatedError('Authentication required, Access denied.');

    const user = await User.findOne({ _id: userId });
    if (!user) throw new NotFoundError('User not found.');

    if (user.security.status !== 'pending') throw new ConflictError('Account already verified');
    const tokenStatus = await user.getVerificationTokenState();
    if (tokenStatus === 'valid') {
        const emailVerify = await emailService.sendVerificationEmail(user.email, user.firstName, user.security.verificationToken.token);
        if (!emailVerify) throw new InternalServerError('Error while sending verification email');
    } else if (tokenStatus === 'expired' || tokenStatus === 'not set') {
        const newToken = await user.createVerificationToken();
        if (!newToken) throw new InternalServerError('Something went wrong while creating verification token');

        const emailVerify = await emailService.sendVerificationEmail(user.email, user.firstName, user.security.verificationToken.token);
        if (!emailVerify) throw new InternalServerError('Error while sending verification email');
    }

    res.status(StatusCodes.OK).json({
        message: 'Email verification resent successfully.',
        results: [],
        success: true
    })

}

const userLogin = async (req, res) => {
    const { error } = userLoginSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);
    
    const { email, password } = req.body;
    const user = await User.findOne({ email })
    .select('+password')
    .select('-nationalId -phoneNumber -dateOfBirth -address');
    if (!user) {
        // Next line for security: Fixing time-based email enumeration
        await new Promise(resolve => setTimeout(resolve, LOGIN_PROCESS_GAP_DELAY));
        throw new UnauthenticatedError("Invalid email or password.");
    };
    const userStatus = await user.loginAttempt();

    const isPasswordCorrect = await user.comparePasswords(password);
    if (!isPasswordCorrect) throw new UnauthenticatedError("Invalid email or password.");
    
    if (userStatus == 'pending') throw new ForbiddenError('Account pending. It needs verification.')
    if (userStatus !== 'active') throw new ForbiddenError('Account restricted. Contact bank customer service.');

    // Removing sensitive data from the user object
    delete user.password;
    await user.resetLoginAttempts();
    const token = await user.createUserJWT(req.clientIp);
    if (!token) throw new InternalServerError('Error while generating token');

    res.status(StatusCodes.OK).json({
        message: 'User logged in successfully.',
        results: {
            firstName: user.firstName,
            token: token
        },
        success: true
    })
}

// User Features Controllers
const getUserAccounts = async (req, res) => {
    const userId = req?.user?.userId;
    if (!userId) throw new UnauthenticatedError('Authentication required, Access denied.');

    const userAccounts = await Account.getAccountsByUserId(userId);
    if (!userAccounts) throw new NotFoundError('No accounts found for this user');

    const accountDetails = userAccounts.map(account => ({
        accountNumber: account.accountNumber,
        accountHolderId: account.accountHolderId,
        accountType: account.accountType,
        balance: account.balance,
        status: account.status
    }));

    res.status(StatusCodes.OK).json({
        message: 'Accounts retrieved successfully',
        results: {
            accounts: accountDetails
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

    const balance = await Account.findOne({ accountNumber, accountHolderId: userId }).select('balance').lean();
    if (!balance) throw new NotFoundError('Account not found');

    res.status(StatusCodes.OK).json({
        message: 'Account balance retrieved successfully.',
        results: {
            balance: balance?.balance
        },
        success: true
    });
}

const createTransfer = async (req, res) => {
    const { accountNumber, toAccount, amount, description } = req.body;
    const userId = req?.user?.userId;
    if (!userId) throw new UnauthenticatedError('Authentication required, Access denied.');

    const { error } = createTransferSchema.validate({ accountNumber, toAccount, amount, description });
    if (error) throw new BadRequestError(error.details[0].message);
    
    if (accountNumber === toAccount) throw new BadRequestError('Cannot transfer to the same account.');

    // Checking Logic
    const sourceAccount = await Account.findOne({ accountNumber: accountNumber, accountHolderId: userId }).select('accountNumber').lean();
    const destinationAccount = await Account.findOne({ accountNumber: toAccount }).select('accountNumber').lean();
    if (!sourceAccount || !destinationAccount) throw new NotFoundError('Account not found');
    
    const transaction = {
        accountNumber: accountNumber,
        transactionType: 'transfer',
        amount: amount,
        toAccount: toAccount,
        description: description,
    }

    // Starting transaction processor & handler
    let result;
    try {
        const transactionService = new TransactionService();
        result = await transactionService.processTransaction(transaction);
        transaction.status = result.status;
        transaction.systemReason = result.systemMessage;
    } catch (err) {
        transaction.status = 'failed';
        transaction.systemReason = 'Unexpected Server error while processing transaction';
        throw new InternalServerError('Something went wrong, while processing transaction');
    }
    
    // Inserting transfer details in DB
    const createdTransfer = await Transaction.create(transaction);
    if (!createdTransfer) {
        // Report unsuccessful transaction insert to DB
        transactionsLogger.error({
            message: 'DB_TRANSACTION_INSERT_ERROR',
            transaction: transaction
        });
        throw new InternalServerError('Failed to record transaction');
    }
 
    if (transaction.status === 'failed') {
        const clientMessage = result?.clientMessage || 'Transfer failed';
        const systemMessage = result?.systemMessage || clientMessage;
        throw new TransactionError(clientMessage, systemMessage);
    }
   
    res.status(StatusCodes.CREATED).json({ message: 'Transfer created successfully', results: { transaction }, success: true });
}

const getTransactionsHistory = async (req, res) => {
    const { userId } = req.user;
    if (!userId) throw new UnauthenticatedError('Authentication required, Access denied.');

    const { error } = getTransferHistorySchema.validate(req.params);
    if (error) throw new BadRequestError(error.details[0].message);

    const { accountNumber } = req.params;
    const account = await Account.findOne({ accountNumber, accountHolderId: userId }).select('accountNumber').lean();
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
    }).limit(15).lean();

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