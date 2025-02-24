const express = require('express');
const router = express.Router();

const { 
    getBalance,
    getTransactionsHistory,
    createTransfer,
    userRegister, 
    userLogin, 
    userLogout 
} = require('../controllers/userController');

const authenticationMiddleware = require('../middleware/authentication');

// User Account Routes (Public)
router.route('/auth/register').post(userRegister);
router.route('/auth/login').post(userLogin);
router.route('/auth/logout').post(userLogout);

// User Features Routes (Protected)
router.route('/balance').get(authenticationMiddleware, getBalance);
router.route('/transactions').get(authenticationMiddleware, getTransactionsHistory);
router.route('/transfer').post(authenticationMiddleware, createTransfer);

module.exports = router;