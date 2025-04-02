require('dotenv').config();
const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcryptjs');
const adminRules  = require('../../../validations/rules/database/adminRules');

const AdminSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    employeeId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true,
        match: [adminRules.EMPLOYEE_ID_REGEX , `Employee ID length must be ${adminRules.EMPLOYEE_ID_LENGTH}`],
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
        minlength: adminRules.ADMIN_PASSWORD.min,
        maxlength: adminRules.ADMIN_PASSWORD.max,
        trim: true,
        select: false
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
    timestamps: true,
    autoIndex: false
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

module.exports = mongoose.model('Admin', AdminSchema);