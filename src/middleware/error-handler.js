require('dotenv').config();
const { StatusCodes } = require('http-status-codes');
const { CustomAPIError } = require('../outcomes/errors');

const errorHandlerMiddleware = (err, req, res, next) => {
    let customError = {};
    if (err instanceof CustomAPIError) {
        customError = {
            statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
            msg: err.message || 'Something went wrong, please try again later'
        }
    } else {
        customError = {
            statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
            msg: 'Something went wrong, please try again later'
        }
    }

    if (err.name === 'ValidationError') {
        customError.msg = Object.values(err.errors)
        .map((item) => item.message)
        customError.statusCode = StatusCodes.BAD_REQUEST;
        err.logLevel = 'warn';
    }

    if (err.name === 'CastError') {
        customError.msg = Object.values(err.errors)
        .map((item) => `Invalid value ${item.value} for ${item.path}`);
        customError.statusCode = StatusCodes.BAD_REQUEST;
        err.logLevel = 'warn';
    }
    
    return res.status(customError.statusCode).json({
        message: customError.msg,
        results: null,
        success: false
    });
}

module.exports = errorHandlerMiddleware;