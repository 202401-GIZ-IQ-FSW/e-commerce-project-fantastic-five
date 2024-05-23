const express = require('express');
const router = express.Router();
const ShopItem = require('../models/shop-item');
// added user model
const User = require('../models/user');


// Add new shop item
router.post('/items', async (req, res) => {
    try {
        const newItem = new ShopItem(req.body); // Create a new shop item using the data from the request body
        const item = await newItem.save(); // Save the new item to the database
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search for shop items
router.get('/items', async (req, res) => {
    try {
        const query = {};
        if (req.query.title) query.title = new RegExp(req.query.title, 'i'); // Case-insensitive search for name
        if (req.query.description) query.description = new RegExp(req.query.description, 'i'); // Case-insensitive search for description
        if (req.query.genreOrCategory) query.genreOrCategory = new RegExp(req.query.genreOrCategory, 'i'); // Case-insensitive search for genre
        const items = await ShopItem.find(query); // Find items in the database that match the query object
        res.json(items); // Respond with found item
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update shop item details
router.put('/items/:id', async (req, res) => {
    try {
        const item = await ShopItem.findByIdAndUpdate(req.params.id, req.body, { new: true }); // Find the item by ID and update it with the new data from the request body
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item); // Respond with the updated item
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete shop items
router.delete('/items/:id', async (req, res) => {
    try {
        const item = await ShopItem.findByIdAndDelete(req.params.id);  // Find item by ID and delete it 
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json({ message: 'Item deleted successfully' });  // Respond with successful message
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// new routes
router.get('/customers', async (req, res) => {
    try {
        const users = await User.find();
        if (!users) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/orders', async (req, res) => {
    try {
        const users = await User.find().populate({ path: 'orders.items.itemId', select: 'title price' }); // Select only the title and price fields from ShopItem
        if (!users) {
            return res.status(404).json({ error: 'Orders not found' });
        }
        const orders = users.map( (user) => { return {name: user.name, email: user.email, orders: user.orders} })
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/new-admin', async (req, res) => {
    try {
        const { email, isAdmin } = req.body;

        // Check if both email and isAdmin are provided
        if (!email) {
            return res.status(400).json({ error: 'Please provide a valid email' });
        } else if (typeof isAdmin !== 'boolean') {
            return res.status(400).json({ error: 'Please provide a valid isAdmin, either true or false' });
        }

        // Prevent changing the status of the main admin
        if (email === process.env.ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Cannot change the status of the main Admin' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.isAdmin = isAdmin;
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.route('/profile')
    .get(async (req, res) => {
        try {
            const adminId = req.session?.user?._id;
            const user = await User.findById(adminId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    })
    .put(async (req, res) => {
        try {
            const adminId = req.session.user._id;
            const updateData = req.body;
            // Prevent changing the main admin
            if (req.session.user.email === process.env.ADMIN_EMAIL) {
                return res.status(403).json({ error: 'Cannot change the main Admin' });
            }
            const user = await User.findByIdAndUpdate(adminId, updateData, { new: true });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    })
    .delete(async (req, res) => {
      try {
          const adminId = req.session.user._id;
          const user = await User.findById(adminId);
          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }
          // Prevent deleting the main admin
          if (user.email === process.env.ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Cannot delete the main Admin' });
          }
          await user.remove();
          res.json({ message: 'Profile deleted successfully' });
      } catch (err) {
          res.status(500).json({ error: err.message });
      }
});

router.get('/items/:id', async (req, res) => {
    try {
        const item = await ShopItem.findById(req.params.id); // Find the item by ID and update it with the new data from the request body
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item); // Respond with the updated item
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/customers/:id', async (req, res) => {
    try {
        const customer = await User.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/customers/:id', async (req, res) => {
    try {
        const customer = await User.findById(req.params.id);
        if (!customer  || customer.isAdmin) {
          return res.status(404).json({ error: 'Customer not found or customer is admin' });
        }
        await customer.remove();
        res.json({ message: 'Customer profile deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

module.exports = router;


