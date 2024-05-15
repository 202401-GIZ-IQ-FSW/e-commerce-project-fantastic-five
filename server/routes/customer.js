const express = require('express');
const router = express.Router();
const ShopItem = require('../models/shop-item');






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




module.exports = router;