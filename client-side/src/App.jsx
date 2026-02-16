import { useState, useEffect } from "react";
import axios from "axios";
import "./index.css";

function App() {
  // Login State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null; 
    }
  });

  const [view, setView] = useState(user ? (user.role === "owner" ? "owner-dashboard" : "menu") : "login");

  // Data State
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [myOrders, setMyOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); 

  // UI State
  const [activeCategory, setActiveCategory] = useState("All");
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentStep, setPaymentStep] = useState("select");
  
  // POPUP STATES
  const [showAdminError, setShowAdminError] = useState(false);
  const [showPhoneError, setShowPhoneError] = useState(false); // NEW: Phone Error
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  const categories = ["All", "Maggi", "Burgers", "Sandwich", "Rolls", "Momos", "Chinese", "Pasta", "Beverages"];

  useEffect(() => {
    axios.get("http://localhost:5000/menu").then(res => setMenu(res.data));
    
    const interval = setInterval(() => {
        if (user?.role === "owner") fetchAllOrders();
        if (user?.role === "student") fetchMyOrders();
    }, 2000); 
    return () => clearInterval(interval);
  }, [user]);

  // --- STUDENT LOGIN ---
  const handleStudentLogin = (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const phone = e.target.phone.value;
    const regNo = e.target.regNo.value;

    if (!name || !phone || !regNo) return alert("Please fill all details");

    // NEW: VALIDATE PHONE NUMBER LENGTH (MUST BE 10)
    if (phone.length !== 10) {
        setShowPhoneError(true);
        return;
    }

    const userData = { name, phone, regNo, role: "student" };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    setView("menu");
  };

  // --- ADMIN LOGIN ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
    const adminId = e.target.adminId.value;

    if (adminId === "admin@nitjsr") {
        const userData = { name: "Owner", role: "owner" };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        setView("owner-dashboard");
    } else {
        setShowAdminError(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setView("login");
  };

  // --- CART & ORDERS ---
  const getQty = (id) => cart[id] || 0;
  const updateQty = (item, delta) => {
    const newQty = getQty(item._id) + delta;
    if (newQty < 0 || newQty > 15) return;
    const newCart = { ...cart };
    newQty === 0 ? delete newCart[item._id] : newCart[item._id] = newQty;
    setCart(newCart);
  };
  const calculateTotal = () => menu.reduce((sum, item) => sum + (item.price * (cart[item._id] || 0)), 0);

  const confirmOrder = async () => {
    const items = menu.filter(i => cart[i._id]).map(i => ({ ...i, qty: cart[i._id] }));
    await axios.post("http://localhost:5000/order", {
        name: user.name, phone: user.phone, regNo: user.regNo,
        items, total: calculateTotal(), paymentMethod: "UPI" // Forced UPI
    });

    setShowOrderSuccess(true);
    setCart({}); 
    setShowCheckout(false); 
    setPaymentStep("select"); 
    fetchMyOrders();
  };

  const closeSuccessPopup = () => {
    setShowOrderSuccess(false);
    setView("orders"); 
  };

  const fetchMyOrders = async () => {
    if (!user) return;
    const res = await axios.get(`http://localhost:5000/orders/${user.phone}`);
    setMyOrders(res.data);
  };

  const fetchAllOrders = async () => {
    const res = await axios.get("http://localhost:5000/all-orders");
    setAllOrders(res.data.reverse()); 
  };

  const markReady = async (orderId) => {
    await axios.post("http://localhost:5000/order-ready", { orderId });
    fetchAllOrders(); 
  };

  return (
    <div className="container">
      
      {/* 1. STUDENT LOGIN */}
      {!user && view === "login" && (
        <div className="login-wrapper">
            <div className="login-left">
                <h1>Engineer's<br/>Point</h1>
            </div>
            <div className="login-right">
                <h2>Student Login</h2>
                <form onSubmit={handleStudentLogin}>
                    <input name="name" placeholder="Full Name" />
                    <input name="phone" type="number" placeholder="Phone Number" />
                    <input name="regNo" placeholder="Registration Number" /> 
                    <button type="submit">Enter Canteen</button>
                </form>
                <p className="hint"><span className="admin-link" onClick={() => setView("admin-login")}>Admin Login</span></p>
            </div>
        </div>
      )}

      {/* 2. ADMIN LOGIN */}
      {!user && view === "admin-login" && (
        <div className="login-wrapper">
            <div className="login-left admin-bg">
                <h1>Owner<br/>Panel</h1>
            </div>
            <div className="login-right">
                <h2>Admin Login</h2>
                <form onSubmit={handleAdminLogin}>
                    <input name="adminId" placeholder="Enter Admin ID" />
                    <button type="submit" className="admin-btn">Login as Owner</button>
                </form>
                <p className="hint"><span className="admin-link" onClick={() => setView("login")}>← Back to Student Login</span></p>
            </div>
        </div>
      )}

      {/* 3. OWNER DASHBOARD */}
      {user?.role === "owner" && (
        <div className="owner-dashboard">
            <header className="owner-header">
                <h2>👨‍🍳 Owner Dashboard</h2>
                <button onClick={handleLogout}>Logout</button>
            </header>
            <div className="orders-list">
                {allOrders.map(order => (
                    <div key={order._id} className={`owner-card ${order.status}`}>
                        <div className="card-top">
                            <h3>{order.name} <small>(Reg: {order.regNo})</small></h3>
                            <span className="status-badge">{order.status}</span>
                        </div>
                        <p>📞 {order.phone}</p>
                        <div className="items-list">
                            {order.items.map((i,idx) => <span key={idx}>{i.qty} x {i.name}, </span>)}
                        </div>
                        <p className="total">Total: ₹{order.total}</p>
                        {order.status === "Preparing" && (
                            <button className="ready-btn" onClick={() => markReady(order._id)}>Mark as Ready ✅</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* 4. STUDENT APP */}
      {user?.role === "student" && (
        <>
        <header>
            <h1>Engineer's Point</h1>
            <div className="nav">
                <button onClick={() => setView("menu")}>Menu</button>
                <button onClick={() => setView("orders")}>My Orders</button>
                <button className="logout" onClick={handleLogout}>Logout</button>
            </div>
        </header>

        {view === "menu" && (
            <div className="menu-view">
                <div className="category-tabs">
                    {categories.map(cat => (
                        <button key={cat} className={activeCategory === cat ? "active-tab" : ""} onClick={() => setActiveCategory(cat)}>{cat}</button>
                    ))}
                </div>
                <div className="menu-grid">
                    {(activeCategory === "All" ? menu : menu.filter(i => i.category === activeCategory)).map(item => (
                        <div key={item._id} className="card">
                            <div className="image-placeholder" style={{backgroundImage: `url(${item.image})`}}></div>
                            <h3>{item.name}</h3>
                            <p>₹{item.price}</p>
                            <div className="qty-controls">
                                {getQty(item._id) > 0 ? (
                                    <>
                                        <button className="minus" onClick={() => updateQty(item, -1)}>-</button>
                                        <span>{getQty(item._id)}</span>
                                        <button className="plus" onClick={() => updateQty(item, 1)}>+</button>
                                    </>
                                ) : <button className="add-btn" onClick={() => updateQty(item, 1)}>ADD</button>}
                            </div>
                        </div>
                    ))}
                </div>
                {Object.keys(cart).length > 0 && (
                    <div className="cart-bar">
                        <div className="cart-info"><span>{Object.keys(cart).length} Items</span><span className="total-price">₹{calculateTotal()}</span></div>
                        <button onClick={() => setShowCheckout(true)}>Proceed</button>
                    </div>
                )}
            </div>
        )}

        {view === "orders" && (
            <div className="orders-view">
                <h2>📦 My Orders</h2>
                {myOrders.map(order => (
                    <div key={order._id} className="order-card">
                        <div className="order-header">
                            <span>#{order._id.slice(-4)}</span>
                            <span className={`status ${order.status === "Ready" ? "ready-green" : "prep"}`}>
                                {order.status === "Ready" ? "✅ READY TO PICKUP" : "⏳ Preparing..."}
                            </span>
                        </div>
                        <div className="order-items">
                             {order.items.map((item, i) => <span key={i}>{item.qty} x {item.name}, </span>)}
                        </div>
                        <p>Total: ₹{order.total}</p>
                    </div>
                ))}
            </div>
        )}

        {/* PAYMENT MODAL (UPDATED: CASH REMOVED) */}
        {showCheckout && (
            <div className="qr-modal">
                <div className="qr-content">
                    {paymentStep === "select" && <>
                        <h3>Payment Mode</h3><p>₹{calculateTotal()}</p>
                        <button className="pay-btn upi" onClick={() => setPaymentStep("UPI")}>Pay via UPI</button>
                        {/* CASH OPTION REMOVED HERE */}
                    </>}
                    {paymentStep === "UPI" && <>
                        <h3 className="upi-title">NIT JAMSHEDPUR NIGHT CANTEEN</h3>
                        <div className="qr-box"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=nightcanteen@nitjsr%26am=${calculateTotal()}`} alt="QR"/></div>
                        <button className="confirm-btn" onClick={confirmOrder}>I have Paid</button>
                    </>}
                    <button className="close-bottom-btn" onClick={() => { setShowCheckout(false); setPaymentStep("select"); }}>Cancel</button>
                </div>
            </div>
        )}
        </>
      )}

      {/* --- ERROR POPUPS --- */}
      {showAdminError && (
        <div className="qr-modal">
            <div className="qr-content">
                <h3 style={{color: "#ff4757"}}>❌ Access Denied</h3>
                <p>The Admin ID you entered is incorrect.</p>
                <button className="close-bottom-btn" onClick={() => setShowAdminError(false)}>Try Again</button>
            </div>
        </div>
      )}

    {/* NEW: PHONE NUMBER ERROR POPUP */}
      {showPhoneError && (
        <div className="qr-modal">
            <div className="qr-content">
                <h3 style={{color: "#ff4757"}}>❌ Invalid Phone Number</h3>
                <p>Phone number must be exactly 10 digits.</p>
                <p style={{marginTop: "5px", color: "#555"}}>To remind you if you forget !!</p>
                <button className="close-bottom-btn" onClick={() => setShowPhoneError(false)}>Try Again</button>
            </div>
        </div>
      )}

      {/* --- SUCCESS POPUP --- */}
      {showOrderSuccess && (
        <div className="qr-modal">
            <div className="qr-content">
                <h3 style={{color: "#2ed573"}}>✅ Order Placed!</h3>
                <p>Your order has been sent to the kitchen.</p>
                <button className="confirm-btn" onClick={closeSuccessPopup}>Track Order</button>
            </div>
        </div>
      )}

    </div>
  );
}
export default App;