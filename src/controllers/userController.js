require('dotenv').config();
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const TransactionService = require('../services/TransactionService');
const logger = require('../utils/logger');
const { TransactionError } = require('../outcomes/transactions');
const { StatusCodes } = require('http-status-codes');
const {
    userRegisterSchema,
    userLoginSchema,
    getAccountBalanceSchema,
    createTransferSchema
} = require('../validations/user/userValidations');

const {
    BadRequestError,
    UnauthenticatedError,
    NotFoundError,
    InternalServerError
} = require('../outcomes/errors');


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

    const token = await user.createUserJWT();
    res.status(StatusCodes.CREATED).json({
        message: 'User registered successfully.',
        results: {
            firstName: userObject.firstName,
            token: token
        },
        success: true
    });
}

const userLogin = async (req, res) => {
    const { email, password } = req.body;

    const { error } = userLoginSchema.validate({ ...req.body });
    if (error) throw new BadRequestError(error.details[0].message);

    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new UnauthenticatedError("Invalid email or password.");

    const isPasswordCorrect = await user.comparePasswords(password);
    if (!isPasswordCorrect) throw new UnauthenticatedError("Invalid email or password.");

    const userObject = user.toObject();
    // Removing sensitive data from the user object
    ['password', 'nationalId', 'phoneNumber', 'dateOfBirth', 'address'].forEach(field => delete userObject[field]);

    const token = await user.createUserJWT();
    res.status(StatusCodes.OK).json({
        message: 'User logged in successfully.',
        results: {
            firstName: userObject.firstName,
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

    const balance = await Account.findOne({ accountNumber, accountHolderId: userId }).select('balance');
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
    const sourceAccount = await Account.findOne({ accountNumber: accountNumber, accountHolderId: userId }).select('accountNumber');
    const destinationAccount = await Account.findOne({ accountNumber: toAccount }).select('accountNumber');
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
        logger.error({
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

const getTransactionsHistory = async (req, res) => {}


module.exports = { 
    getUserAccounts,
    getAccountBalance, 
    getTransactionsHistory,
    createTransfer,
    userRegister,
    userLogin
}