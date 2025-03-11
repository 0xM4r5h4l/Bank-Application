const { StatusCodes } = require('http-status-codes');

class TransactionError extends Error {
    constructor(message, systemMessage = null) {
        super(message);
        this.message = message;
        this.systemMessage = systemMessage || message; // Log message defaults to the error message
        this.statusCode = StatusCodes.BAD_REQUEST;
    }
}

module.exports = TransactionError;