require('dotenv').config();
require('express-async-errors');

const express = require('express');
const app = express();

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const requestIp = require('request-ip');
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

const initializeCronJobs = require('./config/cron');
initializeCronJobs(); // Initialize all cron jobs

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(requestIp.mw());

app.get('/', async (req, res) => {
    res.status(200).json({ message: 'It\'s up and running', results: { name: 'Beacon Bank' }, success: true });
})

app.use('/api/v1/user/', userRoutes);
app.use('/api/v1/admin/', adminRoutes);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

module.exports = app;