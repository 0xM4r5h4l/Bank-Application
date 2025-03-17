const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AdminSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true,
        match: [/^[A-Z0-9]{16}$/ ,' Employee ID must be 10 alphanumeric characters' ],
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 12,
        maxlength: 128,
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
        enum: ['admin', 'superadmin'],
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
    this.lastLogin = Date.now;
    this.lastLoginIp = clientIp || 'Unknown';
    return jwt.sign({
        userId: this._id,
        fullName: 'Unknown',
        role: this.role,
    }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME });
};

module.exports = mongoose.model('Admin', AdminSchema);