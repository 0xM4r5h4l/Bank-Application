const CustomAPIError = require('./custom-error.js');
const { StatusCodes } = require('http-status-codes');

class ForbiddenError extends CustomAPIError {
    constructor(message) {
        super(message, 'warn')
        this.statusCode = StatusCodes.FORBIDDEN;
    }
}

module.exports = ForbiddenError