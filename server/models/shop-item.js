const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShopItemSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true // Removes whitespace from both ends of a string
    },
    image: {
        type: String, // Assuming URL of the image
        required: true,
        trim: true // Removes whitespace from both ends of a string
    },
    price: {
        type: Number,
        required: true,
        min: 0 // Ensure the price is a non-negative number
    },
    description: {
        type: String,
        required: true,
        trim: true // Removes whitespace from both ends of a string
    },
    availableCount: {
        type: Number,
        required: true,
        min: 0 // Ensure the available count is a non-negative number
    },
    genreOrCategory: {
        type: String,
        required: true,
        trim: true // Removes whitespace from both ends of a string
    },
    createdAt: {
        type: Date,
        default: Date.now // Sets the default value to the current date and time
    }
});

// Export the model
module.exports = mongoose.model('ShopItem', ShopItemSchema);
