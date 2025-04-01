const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const userRules  = require('../validations/rules/database/userRules');

const UserSchema = mongoose.Schema({
    userId: {
        type: String,
        default: () => randomUUID(),
        unique: true,
        immutable: true,
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
        index: true
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
        index: true,
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
    timestamps: true
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

UserSchema.methods.comparePasswords = async function(reqPassword) {
    return await bcrypt.compare(reqPassword, this.password);
}

UserSchema.methods.compareNationalId = async function(reqNationalId) {
    return await bcrypt.compare(reqNationalId, this.nationalId)
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