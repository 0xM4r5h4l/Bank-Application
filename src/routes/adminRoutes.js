const express = require('express');
const router = express.Router();
const {
    createUserAccount,
    createAdminAccount,
    adminLogin
} = require('../controllers/adminController');
const authentication = require('../middleware/authentication');
const authorization = require('../middleware/authorization');

// Admin Login Route (Public)
router.route('/login').post(adminLogin);

// Admin Features Routes (Protected: superadmin)
router.route('/panel/createUserAccount').post(authentication, authorization(['admin', 'superadmin']), createUserAccount);

// Admin Registeration
router.route('/register').post(authentication, authorization(['superadmin']), createAdminAccount);

module.exports = router;