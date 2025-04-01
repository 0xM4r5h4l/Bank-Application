require('dotenv').config();
require('express-async-errors');
const express = require('express');
const app = express();
const connectDB = require('./db/connect'); // Database Connection
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const requestIp = require('request-ip');
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');
const logger = require('./utils/logger');
const rules = require('./validations'); // Just to check that rules set properly

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(requestIp.mw());

app.get('/', async (req, res) => {
    res.status(200).json({ message: 'It\'s up and running', results: { name: 'United Bank' }, success: true });
})

app.use('/api/v1/user/', userRoutes);
app.use('/api/v1/admin/', adminRoutes);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3000;
const start = async () => {
    try {
        if (!rules) {
            logger.error('App configs are not loaded properly, stopping...');
            process.exit(1);
        }
        await connectDB(process.env.MONGO_URI);
        app.listen(PORT, () => {
            console.log(`Server started operations on port ${PORT}...`)
        });
    } catch (error) {
        logger.error('Application startup error:', error);
        process.exit(1);
    }
}

start();
