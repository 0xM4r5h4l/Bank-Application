class CustomAPIError extends Error {
    constructor(message, logLevel = 'error'){
        super(message);
        this.logLevel = logLevel;
    }
}

module.exports = CustomAPIError;