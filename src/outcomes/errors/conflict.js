const CustomAPIError = require('./custom-error.js');
const { StatusCodes } = require('http-status-codes');

class ConflictError extends CustomAPIError {
    constructor(message) {
        super(message, 'warn')
        this.statusCode = StatusCodes.CONFLICT;
    }
}

module.exports = ConflictError;