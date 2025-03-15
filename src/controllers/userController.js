require('dotenv').config();
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const TransactionService = require('../services/TransactionService');
const Joi = require('joi');
const {
    BadRequestError,
    UnauthenticatedError,
    NotFoundError,
    ForbiddenError,
    InternalServerError
} = require('../outcomes/errors');
const { TransactionError } = require('../outcomes/transactions');
const { logger } = require('../utils/logger');


// User Auth Controllers
const userRegister = async (req, res) => {
    const schema = Joi.object({
        firstName: Joi.string().min(2).max(50).required(),
        lastName: Joi.string().min(2).max(50).required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
        nationalId: Joi.string().min(14).max(14).required(),
        gender: Joi.string().min(4).max(6).required(),
        address: Joi.string().max(160).required(),
        phoneNumber: Joi.string().required(),
        dateOfBirth: Joi.string().required(),
    })

    const { error } = schema.validate({ ...req.body })
    if (error) {
        throw new BadRequestError(error.details[0].message);
    }

    const user = await User.create({ ...req.body });
    // Removing sensitive data from the user object
    ['password', 'nationalId', 'phoneNumber', 'dateOfBirth', 'address'].forEach(field => delete user[field]);
    if (!user){
        throw new BadRequestError('Couldn\'t register user');
    }

    const token = await user.createUserJWT();
    res.status(StatusCodes.CREATED).json({ fullName: user.fullName, token: token });
}

const userLogin = async (req, res) => {
    const { email, password } = req.body;
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    })

    const {error} = schema.validate({ ...req.body })
    if (error) {
        throw new BadRequestError(error.details[0].message);
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw new UnauthenticatedError("Wrong email/password, access denied");
    }

    const isPasswordCorrect = await user.comparePasswords(password);
    // Removing sensitive data from the user object
    ['password', 'nationalId', 'phoneNumber', 'dateOfBirth', 'address'].forEach(field => delete user[field]);
    if (!isPasswordCorrect) {
        throw new UnauthenticatedError("Wrong email/password, access denied");
    }

    const token = await user.createUserJWT();
    res.status(StatusCodes.OK).json({ fullName: user.fullName , token: token })
}


// User Features Controllers
const getUserAccounts = async (req, res) => {
    const userId = req.user.userId;
    if (!userId) {
        throw new ForbiddenError('Not allowed to access this resource');
    }

    const userAccounts = await Account.getAccountsByUserId(userId);
    if (!userAccounts) {
        throw new NotFoundError('No accounts found for this user');
    }

    const accountDetails = userAccounts.map(account => ({
        accountNumber: account.accountNumber,
        accountHolderId: account.accountHolderId,
        accountType: account.accountType,
        balance: account.balance,
        status: account.status
    }));

    res.status(StatusCodes.OK).json({ accounts: accountDetails });
}

const getAccountBalance = async (req, res) => {
    const { accountNumber } = req.params;
    const { userId } = req.user;
    if (!userId) {
        throw new ForbiddenError('Not allowed to access this resource');
    }

    const schema = Joi.object({
        accountNumber: Joi.string().required(),
        userId: Joi.string().required()
    });

    const { error } = schema.validate({ accountNumber, userId });
    if (error) {
        throw new BadRequestError(error.details[0].message);
    }

    const balance = await Account.findOne({ accountNumber, accountHolderId: userId }).select('balance');
    if (!balance) {
        throw new NotFoundError('Account not found');
    }

    res.status(StatusCodes.OK).json({ balance: balance?.balance });
}

const createTransfer = async (req, res) => {
    const { accountNumber, toAccount, amount, description } = req.body;
    const userId = req.user.userId;
    if (!userId) {
        throw new ForbiddenError('Not allowed to access this resource');
    }
    
    const schema = Joi.object({
        userId: Joi.string().required(),
        accountNumber: Joi.string().required(),
        toAccount: Joi.string().required(),
        amount: Joi.number().strict().required(),
        description: Joi.string().max(20).optional()
    })

    const { error } = schema.validate({ userId, accountNumber, toAccount, amount, description });
    if (error) {
        throw new BadRequestError(error.details[0].message);
    }
    
    // Checking Logic
    const sourceAccount = await Account.findOne({ accountNumber: accountNumber, accountHolderId: userId }).select('accountNumber');
    const destinationAccount = await Account.findOne({ accountNumber: toAccount }).select('accountNumber');
    if (!sourceAccount || !destinationAccount) {
        throw new NotFoundError('Account not found');
    }

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
        console.log('Success: ', result);
        transaction.status = result.status;
        transaction.systemReason = result.systemMessage;
    } catch (err) {
        console.log('Transaction processing error: ', err);
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
        })
    }
 
    if (transaction.status === 'failed') {
        const clientMessage = result?.clientMessage || 'Transfer failed';
        const systemMessage = result?.systemMessage || clientMessage;
        throw new TransactionError(clientMessage, systemMessage);
    }
   
    console.log('Transfer created successfully: ');
    res.status(StatusCodes.CREATED).json({ message: 'Transfer created successfully' });

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