require('dotenv').config()
const connectDB = require('./db/connect'); // Database Connection
const logger = require('./utils/logManager');
const systemEventsLogger = logger.get('system-events');

const rules = require('./validations'); // Just to check that rules set properly
const app = require('./app');

const PORT = process.env.PORT || 3000;
const start = async () => {
    try {
        if (!rules) {
            systemEventsLogger.error('App configs are not loaded properly, stopping...');
            process.exit(1);
        }

        await connectDB(process.env.MONGO_URI);
        systemEventsLogger.info('MongoDB connection successful.');
        
        app.listen(PORT, () => {
            systemEventsLogger.info(`Server started operations on port ${PORT}...`)
        });
    } catch (error) {
        systemEventsLogger.error('Server starting failed!', error)
        process.exit(1);
    }
}

start();