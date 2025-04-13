const crypto = require('crypto');

module.exports = async function(strLength = 16) {
    if (strLength < 12) strLength = 12;

    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%';
    let password = '';
    while (password.length < strLength) {
        password += chars[crypto.randomInt(0, chars.length)];
    }
    return password;
}