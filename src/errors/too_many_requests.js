const CustomAPIError = require('./custom-error');
const {StatusCodes} = require('http-status-codes');

class TooManyRequestsError extends CustomAPIError {
    constructor(message){
        super(message, 'warn')
        this.statusCode = StatusCodes.TOO_MANY_REQUESTS
    }
}

module.exports = TooManyRequestsError;