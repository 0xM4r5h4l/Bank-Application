require('dotenv').config();
const { StatusCodes } = require('http-status-codes');
const Joi = require('joi');
const { BadRequestError, UnauthenticatedError } = require('../errors/index')
const User = require('../models/User');


// User Auth Controllers
const userRegister = async (req, res) => {
    const requiredFields = [
        "firstName",
        "lastName",
        "email",
        "password",
        "nationalId",
        "gender",
        "address",
        "phoneNumber",
        "dateOfBirth",
      ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if ( missingFields.length > 0) {
        throw new BadRequestError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const user = await User.create({ ...req.body});
    if (!user){
        throw new BadRequestError('Couldn\'t register user');
    }
    res.status(200).send(user);
}

const userLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new BadRequestError('Both email and password fields are required');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw new UnauthenticatedError("Wrong email/password, access denied");
    }

    const isPasswordCorrect = await user.comparePasswords(password);
    delete user.password; // Removes the password from the object
    if (!isPasswordCorrect) {
        throw new UnauthenticatedError("Wrong email/password, access denied");
    }

    const token = await user.createJWT();
    res.status(StatusCodes.OK).json({ fullName: user.fullName , token: token })
}

const userLogout = async (req, res) => {}

// User Features Controllers
const getBalance = async (req, res) => {}
const getTransactionsHistory = async (req, res) => {}
const createTransfer = async (req, res) => {}


module.exports = { 
    getBalance, 
    getTransactionsHistory,
    createTransfer,
    userRegister,
    userLogin,
    userLogout
}