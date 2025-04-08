require('dotenv').config()
const connectDB = require('./db/connect'); // Database Connection
const logger = require('./utils/logger');
const rules = require('./validations'); // Just to check that rules set properly
const app = require('./app');

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
        console.log('Server starting failed!', err)
        process.exit(1);
    }
}

start();