const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const { format } = winston;
const { label, combine, timestamp, json } = format;

const container = new winston.Container();

const createTransport = (labelName, filepath) => new DailyRotateFile({
    filename: `./logs/${filepath}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    format: combine(timestamp(), label({ label: labelName }), json()),
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '732d'
});


// User Auth
// Success/fail login attempts
// Session creation or termination (timeout/logout)
container.add('user-auth', {
    transports: [
        createTransport('user-auth', 'auth/users/user-auth')
    ]
})


// Admin Auth
// Success/fail login attempts
// Session createion or termination (timeout/logout)
container.add('admin-auth', {
    transports: [
        createTransport('admin-auth', 'auth/admin/admin-auth')
    ]
})


// Account Management
// Account creation, closure, or freeze
// Changes to accounts
// Account balance adjustment
container.add('account-operations', {
    transports: [
        createTransport('accounts-operations', 'accounts/accounts-operations')
    ]
})


// Transactions
container.add('transactions', {
    transports: [
        createTransport('transactions', 'transactions/transactions')
    ]
})


// Admin Activity
// Success/fail login attempts
// Session createion or termination (timeout/logout)
container.add('admin-actions', {
    transports: [
        createTransport('admin-actions', 'admin/admin-actions')
    ]
})


// Communications: E-mail, SMS, etc
container.add('communications', {
    transports: [
        createTransport('communications', 'communication/communication')
    ]
})


// Audit: copy of all critical events from above.
container.add('audit', {
    transports: [
        createTransport('audit', 'audit/audit')
    ]
})


// System Events
container.add('system-events', {
    transports: [
        new winston.transports.Console({ level: 'info' }),
        createTransport('system-events', 'system/system-events')
    ]
})


// Client Errors
container.add('client-errors', {
    transports: [
        createTransport('client-errors', 'system/errors/client/client-errors')
    ]
})


// Server Errors
container.add('server-errors', {
    transports: [
        createTransport('server-errors', 'system/errors/server/server-errors')
    ]
})

module.exports = container;