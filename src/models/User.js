const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { db: config } = require('../config');

const UserSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: 50,
        match: [/^[A-Za-z\s'-]+$/, 'Invalid characters in first name']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: 50,
        match: [/^[A-Za-z\s'-]+$/, 'Invalid characters in last name']
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
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: config.user.USER_MIN_PASSWORD,
        maxlength: config.user.USER_MAX_PASSWORD,
        trim: true,
        select: false
    },
    nationalId: {
        type: String,
        required: [true, 'NationalId is required'],
        unique: true,
        validate: {
            validator: function(v) {
                return v.length == 14
            },
            message: props => `${props.value} is not a valid NationalId!`
        },
        select: false
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: {
            values: config.user.USER_GENDERS,
            message: '{VALUE} is not a valid gender'
        },
        
    },
    address: { 
        type: String,
        required: [true, 'Address is required'],
        trim: true,
        maxlength: 160
    },
    secondAddress: {
        type: String,
        required: false,
        trim: true,
        maxlength: 160
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        validate: {
            validator: function(v) {
                return validator.isMobilePhone(v, 'ar-EG', {strictMode: true});
            },
            message: props => `${props.value} is not a valid US phone number!`
        },
        index: true
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
                return age >= config.user.MINIMUM_USER_AGE;
            },
            message: 'User is under the minimum age'
        }
    },
    security: {
        lastLogin: String,
        lastFailedLogin: String,
        loginAttempts: { type: Number, default: 0, select: false },
        status: {
            type: String,
            enum: config.user.USER_SECURITY_STATUSES,
            default: 'pending',
        },
        lockedUntil: { type: Date, select: false },
    },

}, {
    timestamps: true
});

// Hashing any password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

UserSchema.methods.comparePasswords = async function(reqPassword) {
    return await bcrypt.compare(reqPassword, this.password);
}

UserSchema.statics.checkDuplicates = async function(userData) {
    if (!userData) throw new Error('checkDuplicates: User data is required');

    if (userData.email) {
        const duplicateEmail = await this.findOne({ email: userData.email });
        if (duplicateEmail) return { error: null, duplicate: 'duplicateEmail' };
    }

    if (userData.nationalId) {
        const duplicateNationalId = await this.findOne({ nationalId: userData.nationalId });
        if (duplicateNationalId) return { error: null, duplicate: 'nationalId' };
    }

    if (userData.phoneNumber) {
        const duplicatePhoneNumber = await this.findOne({ phoneNumber: userData.phoneNumber });
        if (duplicatePhoneNumber) return { error: null, duplicate: 'phoneNumber' };
    }

    return { error: null, duplicate: null };
}

UserSchema.methods.createUserJWT = async function() {
    return jwt.sign({
        userId: this._id,
        fullName: `${this.firstName} ${this.lastName}`,
        role: 'customer'
    }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME });
}

module.exports = mongoose.model('User', UserSchema);