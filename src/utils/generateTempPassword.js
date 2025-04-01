const crypto = require('crypto');

module.exports = async function(passwordLength = 16) {
    if (passwordLength < 12) passwordLength = 12;

    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%';
    let password = '';
    while (password.length < passwordLength) {
        password += chars[crypto.randomInt(0, chars.length)];
    }
    return password;
}