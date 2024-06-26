const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require('validator');
const bcrypt = require('bcrypt');

// Define the cart item schema
const cartItemsSchema = new Schema({
	itemId: {
		type: Schema.Types.ObjectId,
		ref: "ShopItem", // Reference to the ShopItem model
		required: true,
	},
	quantity: {
		type: Number,
		default: 1, // Default quantity is 1
	},
});

// Define the order schema
const orderSchema = new Schema({
	items: [cartItemsSchema], // Array of cart items
	totalAmount: {
		type: Number,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now, // Sets the default value to the current date and time
	},
	ShippingAddress: {
		address: {
			type: String,
			required: true,
		},
		city: {
			type: String,
			required: true,
		},
	},
});

// Define the user schema
// When you call the save() method on the user instance,
// MongoDB automatically generates a unique _id for the document
// and inserts it into the database along with the other fields.
// That's why I didn't put an ID properety 
const userSchema = new Schema({
	name: {
		type: String,
		required: true,
		trim: true, // Removes whitespace from both ends of a string
	},
	email: {
		type: String,
		required: true,
		unique: true, // Ensures email uniqueness
		trim: true, // Removes whitespace from both ends of a string
		lowercase: true, // Converts email to lowercase
		validate: [validator.isEmail, 'Please provide a valid email address']
	},
	password: {
		type: String,
		required: true,
	},
	dateOfBirth: {
		type: Date,
	},
	createdAt: {
		type: Date,
		default: Date.now, // Sets the default value to the current date and time
	},
	isAdmin: {
		type: Boolean,
		default: false,
	}, // Toggle to identify admin users

	cart: [cartItemsSchema], // Array of cart items
	orders: [orderSchema], // Array of orders
});

// Custom password validator
const passwordValidator = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;
    return passwordRegex.test(password);
};

// Pre-save middleware to hash the password before saving
userSchema.pre('save', async function(next) {
    // Hash the password if it's modified or new
    if (!this.isModified('password')) return next();

    // Ensure the password meets the complexity requirements
    if (!passwordValidator(this.password)) {
        return next(new Error('Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'));
    }

    // Hash the password
    try {
        const hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

// Export the model
module.exports = mongoose.model("User", userSchema);
