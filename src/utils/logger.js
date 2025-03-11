const winston = require('winston');

const transports = [];

transports.push(
    new winston.transports.File({
        filename: './logs/app-errors.log',
        level: 'error'
    }),
    new winston.transport.File({
        filename: './logs/client-errors.log',
        level: 'warn'
    })
)

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports,
    // Uncaught exceptions/rejections handler
    exceptionHandlers: [
        new winston.transports.File({ filename: './logs/exceptions.log' })
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: './logs/rejections.log'})
    ]
})

module.exports = logger;