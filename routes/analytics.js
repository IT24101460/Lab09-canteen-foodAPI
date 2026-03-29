const express = require('express');
const Order = require('../models/Order');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/total-spent/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    const result = await Order.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(studentId) } },
      { $group: { _id: '$student', totalSpent: { $sum: '$totalPrice' } } }
    ]);

    const totalSpent = result.length > 0 ? result[0].totalSpent : 0;

    res.json({ studentId, totalSpent });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/daily-orders', async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/top-menu-items', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const result = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.menuItem",
          totalOrdered: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "menuitems",
          localField: "_id",
          foreignField: "_id",
          as: "menuItem"
        }
      },
      { $unwind: "$menuItem" },
      {
        $project: {
          menuItemId: "$_id",
          name: "$menuItem.name",
          totalOrdered: 1,
          _id: 0
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;