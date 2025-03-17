const winston = require('winston');

const transports = [];

transports.push(
    new winston.transports.File({
        filename: './logs/security.log',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    })
)

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports
})

module.exports = logger;