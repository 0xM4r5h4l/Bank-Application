require('dotenv').config();
const EmailService = require('../services/EmailService');
const UserService = require('../services/UserService');
const AccountService = require('../services/AccountService');
const TransactionService = require('../services/TransactionService');
const emailService = new EmailService(process.env.DOMAIN);
const userService = new UserService(emailService);
const accountService = new AccountService();
const transactionService = new TransactionService();

module.exports = {
    emailService,
    userService,
    accountService,
    transactionService
}