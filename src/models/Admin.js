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
        trim: true,
        validate: {
            validator: validator.isEmail,
            message: 'Invalid email format'
        },
        index: true
    },
    lastLogin: { type: Date },
    lastLoginIp: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    role: {
        type: String,
        enum: adminRules.ADMIN_ROLES.values,
        default: adminRules.ADMIN_ROLES.default,
        required: true
    }
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


AdminSchema.methods.createAdminJWT = async function(clientIp) {
    this.lastLogin = new Date();
    this.lastLoginIp = clientIp || 'Unknown';
    await this.save();
    return jwt.sign({
        userId: this._id,
        fullName: 'Unknown',
        role: this.role,
    }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME });
};

module.exports = mongoose.model('Admin', AdminSchema);