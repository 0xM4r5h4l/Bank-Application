const mongoose = require('mongoose');

const connectDB = async (url) => {
    try {
        // useNewUrlParser - useUnifiedTopology are deprecated since Node.js Driver 4.0.0
        await mongoose.connect(url);
        return mongoose.connection;
    } catch (error) {
        throw error;
    }
}

module.exports = connectDB;