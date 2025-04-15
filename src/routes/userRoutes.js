const express = require('express');
const router = express.Router();

const { 
    getUserAccounts,
    getAccountBalance,
    getTransactionsHistory,
    createTransfer,
    userRegister, 
    userLogin,
    userVerifyEmail,
    userResendVerification
} = require('../controllers/userController');

const authenticationMiddleware = require('../middleware/authentication');
const authorization = require('../middleware/authorization');

// User Account Routes (Public)
router.route('/register').post(userRegister);
router.route('/verify/:token').post(userVerifyEmail);
router.route('/login').post(userLogin);
router.route('/resend-verification').post(authenticationMiddleware, authorization(['customer']), userResendVerification);

// User Features Routes (Protected)
router.route('/accounts').get(authenticationMiddleware, authorization(['customer']), getUserAccounts);
router.route('/balance/:accountNumber').get(authenticationMiddleware, authorization(['customer']), getAccountBalance);
router.route('/transactions/history/:accountNumber').get(authenticationMiddleware, authorization(['customer']), getTransactionsHistory);
router.route('/transfer').post(authenticationMiddleware, authorization(['customer']), createTransfer);

module.exports = router;