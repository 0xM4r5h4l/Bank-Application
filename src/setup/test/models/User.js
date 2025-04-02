require('dotenv').config();
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const userRules  = require('../../../validations/rules/database/userRules');

const UserSchema = mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: userRules.USER_FIRSTNAME.min,
        maxlength: userRules.USER_FIRSTNAME.max,
        match: [userRules.USER_FIRSTNAME.regex, 'Invalid characters in first name'],
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: userRules.USER_LASTNAME.min,
        maxlength: userRules.USER_LASTNAME.max,
        match: [userRules.USER_LASTNAME.regex, 'Invalid characters in last name'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: validator.isEmail,
            message: 'Invalid email format'
        },
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: userRules.USER_PASSWORD.min,
        maxlength: userRules.USER_PASSWORD.max,
        trim: true,
        select: false
    },
    nationalId: {
        type: String,
        required: [true, 'NationalId is required'],
        unique: true,
        validate: {
            validator: function(v) {
                return v.length == userRules.USER_NATIONAL_ID_LENGTH
            },
            message: props => `${props.value} is not a valid NationalId!`
        },
        select: false
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: {
            values: userRules.USER_GENDERS,
            message: '{VALUE} is not a valid gender'
        },
    },
    address: { 
        type: String,
        required: [true, 'Address is required'],
        trim: true,
        minlength: userRules.USER_ADDRESS.min,
        maxlength: userRules.USER_ADDRESS.max,
    },
    secondAddress: {
        type: String,
        required: false,
        trim: true,
        minlength: userRules.USER_ADDRESS.min,
        maxlength: userRules.USER_ADDRESS.max,
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        maxlength: userRules.USER_PHONE_NUMBER_LENGTH,
        validate: {
            validator: function(v) {
                return validator.isMobilePhone(v, 'ar-EG', {strictMode: true});
            },
            message: props => `${props.value} is not a valid US phone number!`
        },
    },
    dateOfBirth: { 
        type: String, 
        required: [true, 'Date of birth is required'],
        validate: {
            validator: function(dob) {
                const [year, month, day] = dob.split('-').map(Number);
                if (isNaN(year) || isNaN(month) || isNaN(day)){
                    return false;
                }
                const birthDate = new Date(year, month -1, day);
                const ageDiffMs = Date.now() - birthDate.getTime();
                const ageDate = new Date(ageDiffMs);
                const age = Math.abs(ageDate.getUTCFullYear() - 1970);
                return age >= userRules.USER_AGE.min && age <= userRules.USER_AGE.max;
            },
            message: `User age cant be less than ${userRules.USER_AGE.min} or more than ${userRules.USER_AGE.max} years old`
        }
    },
    security: {
        lastLogin: String,
        lastFailedLogin: String,
        loginAttempts: { type: Number, default: 0, select: false },
        status: {
            type: String,
            enum: userRules.USER_SECURITY_STATUSES,
            default: 'pending',
        },
        lockedUntil: { type: Date, select: false },
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: false,
    }
}, {
    timestamps: true,
    autoIndex: false
});

// Hashing any password before saving
UserSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    if (this.isModified('nationalId')) {
        const salt = await bcrypt.genSalt(10);
        this.nationalId = await bcrypt.hash(this.nationalId, salt);
    }
    next();
})
module.exports = mongoose.model('User', UserSchema);