require('dotenv').config();
require('express-async-errors');

const express = require('express');
const app = express();

// API Routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Database Connection
const connectDB = require('./db/connect');

const requestIp = require('request-ip');
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');


app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(requestIp.mw());

app.get('/', async (req, res) => {
    res.status(200).json({status: "UP", name: 'United Bank'});
})

app.use('/api/v1/user/', userRoutes);
app.use('/api/v1/admin/', adminRoutes);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3000;
const start = async () => {
    try{
        await connectDB(process.env.MONGO_URI)
        app.listen(PORT, () => {
            console.log(`Server started operations on port ${PORT}...`)
        });
    }catch(error){
        console.log(error);
    }
}

start();
