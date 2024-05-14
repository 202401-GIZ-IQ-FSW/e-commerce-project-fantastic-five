const express = require('express');
const router = express.Router();
const ShopItem = require('../models/shop-item');

// Add new shop item
router.post('/items', async (req, res) => {
    try {
        const newItem = new ShopItem(req.body); // Create a new shop item using the data from the request body
        const item = await newItem.save(); // Save the new item to the database
        res.status(201).json(item);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Search for shop items
router.get('/items/search', async (req, res) => {
    try {
        const query = {}; 
        if (req.query.name) query.name = new RegExp(req.query.name, 'i'); // Case-insensitive search for name
        if (req.query.description) query.description = new RegExp(req.query.description, 'i'); // Case-insensitive search for description
        if (req.query.genre) query.genre = new RegExp(req.query.genre, 'i'); // Case-insensitive search for genre
        const items = await ShopItem.find(query); // Find items in the database that match the query object
        res.json(items); // Respond with found item
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update shop item details
router.put('/items/:id', async (req, res) => {
    try {
        const item = await ShopItem.findByIdAndUpdate(req.params.id, req.body, { new: true }); // Find the item by ID and update it with the new data from the request body
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item); // Respond with the updated item
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete shop items
router.delete('/items/:id', async (req, res) => {
    try {
        const item = await ShopItem.findByIdAndDelete(req.params.id);  // Find item by ID and delete it 
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json({ message: 'Item deleted successfully' });  // Respond with successful message
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
