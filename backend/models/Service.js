const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        enum: ['Education', 'Repair', 'Health & Fitness', 'Tech Help', 'Other'],
    },
    price: {
        type: Number,
        required: [true, 'Please add a price'],
    },
    imageUrl: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/1055/1055687.png'
    },
    contactInfo: {
        type: String,
        required: [true, 'Please add contact info'],
    },
    provider: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    }
}, {
    timestamps: true,
});

// This is the crucial line. It compiles the schema into a model and exports it.
module.exports = mongoose.model('Service', serviceSchema);