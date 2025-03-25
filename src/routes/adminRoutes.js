const express = require('express');
const router = express.Router();
const authentication = require('../middleware/authentication');
const authorization = require('../middleware/authorization');
const {
    createUserAccount,
    updateUserAccount,
    createAdminAccount,
    adminLogin
} = require('../controllers/adminController');

// Admin Login Route (Public)
router.route('/login').post(adminLogin);

// Admin Control Panel (Protected: >= admin)
router.route('/panel/createUserAccount').post(authentication, authorization(['admin', 'superadmin']), createUserAccount);
router.route('/panel/updateUserAccount').post(authentication, authorization(['admin', 'superadmin']), updateUserAccount);

// Admin Features Routes (Protected: superadmin)
router.route('/register').post(authentication, authorization(['superadmin']), createAdminAccount);

module.exports = router;