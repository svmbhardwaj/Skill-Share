const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // Optional for Google OAuth users
    googleId: { type: String, unique: true, sparse: true }, // Google OAuth ID
    avatar: { type: String }, // Profile picture from Google
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    verified: { type: Boolean, default: false },
    location: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number] }, // [longitude, latitude]
    },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
}, { timestamps: true });

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });

// Encrypt password using bcrypt before saving (only if password exists and is modified)
userSchema.pre('save', async function (next) {
    if (!this.password || !this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to match user-entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);