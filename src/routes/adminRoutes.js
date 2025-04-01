const express = require('express');
const router = express.Router();
const authentication = require('../middleware/authentication');
const authorization = require('../middleware/authorization');
const {
    createUserAccount,
    updateUserData,
    updateUserAccount,
    createAdminAccount,
    adminLogin
} = require('../controllers/adminController');

// Admin Login Route (Public)
router.route('/login').post(adminLogin);

// Admin Control Panel (Protected: >= admin)
router.route('/users/accounts').post(authentication, authorization(['admin', 'superadmin']), createUserAccount);
router.route('/users/accounts/update').put(authentication, authorization(['admin', 'superadmin']), updateUserAccount);
router.route('/users/data/update').put(authentication, authorization(['admin', 'superadmin']), updateUserData);

// Admin Features Routes (Protected: superadmin)
router.route('/register').post(authentication, authorization(['superadmin']), createAdminAccount);

module.exports = router;