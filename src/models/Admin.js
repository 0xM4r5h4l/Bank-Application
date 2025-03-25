const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { db: config } = require('../config');

const AdminSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true,
        match: [config.admin.EMPLOYEE_ID_REGEX , `Employee ID length must be ${config.admin.EMPLOYEE_ID_LENGTH}`],
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: config.admin.ADMIN_MIN_PASSWORD,
        maxlength: config.admin.ADMIN_MAX_PASSWORD,
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
        enum: config.admin.ADMIN_ROLES,
        default: 'admin',
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