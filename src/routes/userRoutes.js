const express = require('express');
const router = express.Router();

const { 
    getUserAccounts,
    getAccountBalance,
    getTransactionsHistory,
    createTransfer,
    userRegister, 
    userLogin,
} = require('../controllers/userController');

const authenticationMiddleware = require('../middleware/authentication');

// User Account Routes (Public)
router.route('/auth/register').post(userRegister);
router.route('/auth/login').post(userLogin);

// User Features Routes (Protected)
router.route('/getUserAccounts').get(authenticationMiddleware, getUserAccounts);
router.route('/balance/:accountNumber').get(authenticationMiddleware, getAccountBalance);
router.route('/transactions/:accountNumber').get(authenticationMiddleware, getTransactionsHistory);
router.route('/transfer').post(authenticationMiddleware, createTransfer);

module.exports = router;