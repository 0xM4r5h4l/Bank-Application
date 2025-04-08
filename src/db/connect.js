const mongoose = require('mongoose');

const connectDB = async (url) => {
    try {
        // useNewUrlParser - useUnifiedTopology are deprecated since Node.js Driver 4.0.0
        await mongoose.connect(url);
        console.log('MongoDB connection successful.');
        return mongoose.connection;
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        throw error;
    }
}

module.exports = connectDB;