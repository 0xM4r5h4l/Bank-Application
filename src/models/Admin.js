const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcrypt');

const AdminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true
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
    },
    role: {
        type: String,
        enum: ['admin', 'superadmin'],
        default: 'admin'
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
AdminSchema.methods.comparePassword = function(password) {
    return bcrypt.compare(password, this.password);
};

AdminSchema.methods.createAdminJWT = async function() {
    return jwt.sign({
        userId: this._id,
        fullName: this.fullName,
        role: this.role,
    }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME });
};

module.exports = mongoose.model('Admin', AdminSchema);