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
    /**
    new winston.transports.File({
        filename: './logs/security/accounts.log',
        format: winston.format.combine((info => {
            return info.category === 'accounts' ? info : false
        })(),
        winston.format.json()
    )
    }),
    new winston.transports.File({
        filename: './logs/security/transactions/successful-transactions.log',
        format: winston.format.combine((info => {
            return info.category === 'completed-transations' ? info : false
        })(),
        winston.format.json()
    )
    }),
    new winston.transports.File({
        filename: './logs/security/transactions/failed-transactions.log',
        format: winston.format.combine((info => {
            return info.category === 'failed-transations' ? info : false
        })(),
        winston.format.json()
    )
    }),
    new winston.transports.File({
        filename: './logs/security/admins.log',
        format: winston.format.combine((info => {
            return info.category === 'admins' ? info : false 
        })(),
        winston.format.json()
    )
    }),
    new winston.transports.File({
        filename: './logs/security/users.log',
        format: winston.format.combine(( info => {
            return info.category === 'users' ? info : false
        })(),
        winston.format.json()
    )
    }) */
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