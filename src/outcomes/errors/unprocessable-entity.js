const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom-error');

class UnprocessableEntityError extends CustomAPIError {
    constructor(message){
        super(message, 'warn');
        this.statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
    }
}

module.exports = UnprocessableEntityError;