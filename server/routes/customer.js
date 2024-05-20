const express = require('express');
const router = express.Router();
const ShopItem = require('../models/shop-item');
const Cart = require('../models/user');
const User = require('../models/user');
const Order = require('../models/user');
const ensureAuthenticated = require('../middleware/ensureAuthenticated');


/// Getting all shop items with search functionality
router.get('/items', async (req, res) => {
  try {

    const userId = req.session?.user?._id;

    console.log(`============================${[userId]}================================`);

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


// Get cart endpoint
router.get('/cart', async (req, res) => {
  try {
    const customerId = req.session?.user?._id;

    if (!customerId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cartItems = [];
    for (const cartItem of user.cart) {
      const item = await ShopItem.findById(cartItem.itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      cartItems.push({
        itemId: item._id,
        itemName: item.title,
        quantity: cartItem.quantity,
        price: item.price,
        totalPrice: cartItem.quantity * item.price
      });
    }

    res.status(200).json({
      cart: cartItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cart', async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const customerId = req.session?.user?._id;

    if (!customerId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

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

    // Find the user by ID and add the item to their cart
    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a cart item object
    const cartItem = {
      itemId: item._id,
      quantity: quantity,
    };

    // Add item to user's cart
    user.cart.push(cartItem);
    await user.save();

    res.status(200).json({ message: 'Item added to cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Checkout endpoint
router.post('/checkout', async (req, res) => {
  try {
    const customerId = req.session?.user?._id;

    if (!customerId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalAmount = 0;
    const orderList = [];


    for (const fetchedItem of user.cart) {
      const item = await ShopItem.findById(fetchedItem.itemId);
      console.log(item);
      const itemTotal = fetchedItem.quantity * item.price;
      totalAmount += itemTotal;

      orderList.push({
        itemId: fetchedItem.itemId,
        quantity: fetchedItem.quantity,
        price: item.price,
      });
    }

    const order = {
      items: orderList,
      totalAmount: totalAmount,
      createdAt: new Date(),
      ShippingAddress: req.body.ShippingAddress, //
    };

    user.orders.push(order);
    user.cart = [];
    await user.save();

    res.status(200).json({
      message: 'Order placed successfully',
      order: order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetching Orders
router.get('/customer/orders', async (req, res) => {
  try {
    const customerId = req.session?.user?._id;

    if (!customerId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(customerId).select('orders');
    res.status(200).json({ orders: user.orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Fetching and Updating Profile
router.get('/profile', async (req, res) => {
  try {
    const customerId = req.session?.user?._id;

    if (!customerId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(customerId);
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const customerId = req.session?.user?._id;

    if (!customerId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      customerId,
      { name, email },
      { new: true }
    );

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;