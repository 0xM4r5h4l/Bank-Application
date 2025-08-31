const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adminRules  = require('../validations/rules/database/adminRules');

const AdminSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true,
        match: [adminRules.EMPLOYEE_ID_REGEX , `Employee ID length must be ${adminRules.EMPLOYEE_ID_LENGTH}`],
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: adminRules.ADMIN_PASSWORD.min,
        maxlength: adminRules.ADMIN_PASSWORD.max,
        trim: true,
        select: false
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
    security: {
        lastLogin: { type: Date },
        lastLoginIp: { type: String },
        loginAttempts: { type: Number, default: 0 },
        status: {
            type: String,
            enum: adminRules.ADMIN_SECURITY_STATUSES,
            default: 'pending',
        }
    },
    role: {
        type: String,
        enum: adminRules.ADMIN_ROLES.values,
        default: adminRules.ADMIN_ROLES.default,
        required: true
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, {
    timestamps: true
});

// Hash password before saving
AdminSchema.pre('save', async function(next) {
    if (this.isModified('password') || this.isNew) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Compare password
AdminSchema.methods.comparePasswords = async function(reqPassword) {
    return await bcrypt.compare(reqPassword, this.password);
};

// TODO: Create updateAdmin method (requires: superadmin role) updateAdmin() {}

AdminSchema.methods.loginAttempt = async function() {
    /**
     * Attempt registered: returns true
     * User locked: return false
     */

    if (this.security.status !== 'active') {
        this.security.loginAttempts += 1;
        await this.save();
        return this.security.status;
    }
    if (this.security.loginAttempts >= adminRules.ADMIN_MAX_LOGIN_ATTEMPTS) {
        this.security.status = 'locked';
        await this.save();
        return this.security.status;
    } else {
        this.security.loginAttempts += 1;
        await this.save();
        return this.security.status ;
    }
}

AdminSchema.methods.resetLoginAttempts = async function() {
    this.security.loginAttempts = 0;
    await this.save();
    return true;
}


AdminSchema.methods.createAdminJWT = async function(clientIp) {
    this.security.lastLogin = new Date();
    this.security.lastLoginIp = clientIp || 'Unknown';
    await this.save();
    return jwt.sign({
        userId: this._id,
        role: this.role,
    }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: process.env.JWT_LIFETIME });
};

module.exports = mongoose.model('Admin', AdminSchema);