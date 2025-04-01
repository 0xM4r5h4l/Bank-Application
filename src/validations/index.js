const adminValidations = require('./admin/adminValidations');
const userValidations = require('./user/userValidations');
const accountRules = require('./rules/database/accountRules');
const adminRules = require('./rules/database/adminRules');
const transactionRules = require('./rules/database/transactionRules');
const userRules = require('./rules/database/userRules');

module.exports = {
    adminValidations,
    userValidations,
    accountRules,
    adminRules,
    transactionRules,
    userRules
}