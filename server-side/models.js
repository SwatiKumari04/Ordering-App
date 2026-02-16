const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: String,
    price: Number,
    image: String,
    category: String
});

const orderSchema = new mongoose.Schema({
    user: String,
    items: Array,
    total: Number,
    status: { type: String, default: "Pending" } // Pending -> Ready
});

const Food = mongoose.model("Food", foodSchema);
const Order = mongoose.model("Order", orderSchema);

module.exports = { Food, Order };