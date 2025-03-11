const express = require('express');
const router = express.Router();
const {
    createUserAccount,
    adminRegister,
    adminLogin
} = require('../controllers/adminController');


// Admin Auth Routes (Public)
router.route('/register').post(adminRegister);
router.route('/login').post(adminLogin);

// Admin Features Routes (Protected)
router.route('/createUserAccount').post(createUserAccount);

module.exports = router;