const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// --- MENU DATA (Engineers Point) ---
let menu = [
    // --- MAGGI ---
    { _id: "m1", name: "Plain Maggi", price: 30, category: "Maggi", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTk6_QgyUBsIcKLoGsLRPE_DI2Ngzq7Y7BUSQ&s" },
    { _id: "m2", name: "Veg Maggi", price: 35, category: "Maggi", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQs9UVVd_PkBbjCrgFan0WQzp8gUX6JJJQ22w&s" },
    { _id: "m3", name: "Egg Maggi", price: 40, category: "Maggi", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0U7Ka8wPXb11XnlyGV0O0B1WLxXi6Wun_nQ&s" },
    { _id: "m4", name: "Chicken Maggi", price: 60, category: "Maggi", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSb1KlwbVy0yZ_CTV-XalAk2EtEYwo2sxOE8g&s" },

    // --- BURGERS ---
    { _id: "b1", name: "Veg Burger", price: 50, category: "Burgers", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqpCMCouPSDZqvpv2IMhuxCY8plDIEnexGtQ&s" },
    { _id: "b2", name: "Paneer Burger", price: 60, category: "Burgers", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQv5fgkI0khWXFuuzMz5evnWShzwXL5Ma1dBQ&s" },
    { _id: "b3", name: "Chicken Burger", price: 70, category: "Burgers", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGjALI416_Qas6MgA6yZ8Og6WZmSOv4kn4OA&s" },

    // --- SANDWICHES ---
    { _id: "s1", name: "Veg Sandwich", price: 50, category: "Sandwich", image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500" },
    { _id: "s2", name: "Egg Sandwich", price: 60, category: "Sandwich", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTflZPVLr6kVCe47IlxHIyfJsjDGuEdqyFSFg&s" },
    { _id: "s3", name: "Chicken Sandwich", price: 75, category: "Sandwich", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQA6te-hLWS36Vu_I7pJRmtaeyPo6oFFKVP_g&s" },

    // --- ROLLS ---
    { _id: "r1", name: "Veg Roll", price: 40, category: "Rolls", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500" },
    { _id: "r2", name: "Egg Roll", price: 50, category: "Rolls", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTClZkngYhoCXcQ6DuB9uqq6Wp5_fHaePhVVQ&s" },
    { _id: "r3", name: "Chicken Roll", price: 75, category: "Rolls", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXClat_CRywJpYR1RX0MogYSmVDFmL-GqQCA&s" },

    // --- MOMOS ---
    { _id: "mo1", name: "Veg Momos", price: 60, category: "Momos", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQeJlmQgIvNTVBlPQMoQh5Byya_LvmeIUms4w&s" },
    { _id: "mo2", name: "Chicken Momos", price: 90, category: "Momos", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0Lc36jKpubfOTNTbTee2IJvZbsRMPAsemFA&s" },
    { _id: "mo3", name: "Fried Momos", price: 75, category: "Momos", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNW0PI5ry2ZQTKy4AKkv3Q0WOYxdar8HoJ8w&s" },

    // --- CHINESE ---
    { _id: "c1", name: "Veg Chowmin", price: 50, category: "Chinese", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500" },
    { _id: "c2", name: "Chicken Chowmin", price: 80, category: "Chinese", image: "https://www.cookingclassy.com/wp-content/uploads/2019/01/chow-mein-9.jpg" },
    { _id: "c3", name: "Fried Rice", price: 50, category: "Chinese", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNPwIjsEARR3sI92Eeqao0gv_edGHlNUarfg&s" },
    { _id: "c4", name: "Manchurian", price: 100, category: "Chinese", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoznLy2QSLmkY4XvKkeEjHS1M6O9uKDy5tsQ&s" },
    { _id: "c5", name: "Chilly Potato", price: 100, category: "Chinese", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyCQWoR6oovSC9ReF3g1MmHOQiMd1wmiRyPA&s" },

    // --- PASTA ---
    { _id: "p1", name: "Veg Pasta", price: 90, category: "Pasta", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500" },
    { _id: "p2", name: "Chicken Pasta", price: 110, category: "Pasta", image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=500" },

    // --- BEVERAGES ---
    { _id: "d1", name: "Tea", price: 10, category: "Beverages", image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500" },
    { _id: "d2", name: "Cold Coffee", price: 65, category: "Beverages", image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500" },
    { _id: "d3", name: "Oreo Shake", price: 75, category: "Beverages", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500" }
];
let orders = []; // Stores all orders

// --- API ROUTES ---

// 1. Get Menu
app.get("/menu", (req, res) => res.json(menu));

// 2. Place Order (Student)
app.post("/order", (req, res) => {
    const newOrder = { 
        _id: Date.now().toString(), 
        ...req.body, 
        status: "Preparing" // Default status
    };
    orders.push(newOrder);
    console.log(`🔔 New Order for ${req.body.name}`);
    res.json({ success: true, orderId: newOrder._id });
});

// 3. Get Student Orders
app.get("/orders/:phone", (req, res) => {
    const studentOrders = orders.filter(order => order.phone === req.params.phone);
    res.json(studentOrders);
});

// 4. OWNER: Get ALL Orders
app.get("/all-orders", (req, res) => {
    res.json(orders);
});

// 5. OWNER: Mark Order as Ready
app.post("/order-ready", (req, res) => {
    const { orderId } = req.body;
    const order = orders.find(o => o._id === orderId);
    if (order) {
        order.status = "Ready"; // Change status
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

app.listen(5000, () => console.log("🚀 Server Running on Port 5000"));