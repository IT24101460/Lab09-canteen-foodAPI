const express = require('express');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

const router = express.Router();

async function calculateTotalPrice(items) {
  const menuItemIds = items.map(item => item.menuItem);
  const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

  const priceMap = {};
  menuItems.forEach(item => {
    priceMap[item._id.toString()] = item.price;
  });

  let total = 0;
  for (const item of items) {
    const price = priceMap[item.menuItem];
    if (!price) throw new Error(`Menu item not found: ${item.menuItem}`);
    total += price * item.quantity;
  }

  return total;
}

// POST /orders - create order
router.post('/', async (req, res) => {
  try {
    const { student, items } = req.body;
    const totalPrice = await calculateTotalPrice(items);
    const order = new Order({ student, items, totalPrice });
    const saved = await order.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating order:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// GET /orders - get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('student').populate('items.menuItem').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /orders/:id - get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('student').populate('items.menuItem');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err.message);
    res.status(400).json({ error: 'Invalid order ID' });
  }
});

module.exports = router;