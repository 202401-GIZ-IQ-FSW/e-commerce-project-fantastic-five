const express = require('express');
const router = express.Router();
const ShopItem = require('../models/shop-item');
const Cart = require('../models/user');
const User = require('../models/user');
const ensureAuthenticated = require('../middleware/ensureAuthenticated');


/// Getting all shop items with search functionality
router.get('/items', async (req, res) => {
  try {
    const { genreOrCategory, minPrice, maxPrice, title, description } = req.query;
    let query = {};
    if (title) query.title = new RegExp(title, 'i');
    if (description) query.description = new RegExp(description, 'i');
    if (genreOrCategory) query.genreOrCategory = genreOrCategory;
    if (isValidPrice(minPrice)) query.price = { ...query.price, $gte: parseFloat(minPrice) };
    if (isValidPrice(maxPrice)) query.price = { ...query.price, $lte: parseFloat(maxPrice) };

    const items = await ShopItem.find(query);
    res.json(items);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
})

// Ensuring that min and max prices are valid
function isValidPrice(price) {
  const regex = /^[0-9]+(\.[0-9]+)?$/;
  return regex.test(price);
}

// -------------------------------




/// Getting single shop item 
router.get('/items/:id', async (req, res) => {
  try {
    const item = await ShopItem.findById(req.params.id); // Find the item by ID and update it with the new data from the request body
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item); // Respond with the updated item
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.post('/cart', async (req, res) => {
  try {
    const { customerId, itemId, quantity } = req.body;

    // Check if item exists in inventory
    const item = await ShopItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if requested quantity is available in inventory
    if (item.availableCount < quantity) {
      return res.status(400).json({ message: 'Insufficient quantity' });
    }

    // Decrement quantity in inventory
    item.availableCount -= quantity;
    await item.save();

    const userObject = new User();
    userObject.cart.push(item);

    res.status(200).json({ message: 'Item added to cart' },);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.get('/cart', ensureAuthenticated, async (req, res) => {
  try {
  
    console.log(user);
    const cart = await Cart.find();
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



module.exports = router;