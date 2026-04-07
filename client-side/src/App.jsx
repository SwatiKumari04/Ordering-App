import { useState, useEffect } from "react";
import axios from "axios";
import "./index.css";

const API_URL = "http://localhost:5000"; // backend server url

function App() {
  // user login state
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [view, setView] = useState(
    user ? (user.role === "owner" ? "owner-dashboard" : "menu") : "login"
  );

  // data states
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [myOrders, setMyOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // for owner panel

  // ui states
  const [activeCategory, setActiveCategory] = useState("All");
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentStep, setPaymentStep] = useState("select");

  // popup states
  const [showAdminError, setShowAdminError] = useState(false);
  const [showPhoneError, setShowPhoneError] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  const categories = [
    "All",
    "Maggi",
    "Burgers",
    "Sandwich",
    "Rolls",
    "Momos",
    "Chinese",
    "Pasta",
    "Beverages",
  ];

  // fetching menu and polling for order updates
  useEffect(() => {
    axios.get(`${API_URL}/menu`).then((res) => setMenu(res.data));

    // polling every 2 seconds to check for order status updates
    const interval = setInterval(() => {
      if (user?.role === "owner") fetchAllOrders();
      if (user?.role === "student") fetchMyOrders();
    }, 2000);
    return () => clearInterval(interval);
  }, [user]);

  // ========== STUDENT LOGIN ==========
  const handleStudentLogin = (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const phone = e.target.phone.value;
    const regNo = e.target.regNo.value;

    if (!name || !phone || !regNo) return alert("Please fill all details");

    // phone number must be exactly 10 digits
    if (phone.length !== 10) {
      setShowPhoneError(true);
      return;
    }

    const userData = { name, phone, regNo, role: "student" };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    setView("menu");
  };

  // ========== ADMIN LOGIN ==========
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

  // logout function
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setView("login");
  };

  // ========== CART FUNCTIONS ==========
  const getQty = (id) => cart[id] || 0;

  const updateQty = (item, delta) => {
    const newQty = getQty(item._id) + delta;
    if (newQty < 0 || newQty > 15) return; // max 15 of each item
    const newCart = { ...cart };
    if (newQty === 0) {
      delete newCart[item._id];
    } else {
      newCart[item._id] = newQty;
    }
    setCart(newCart);
  };

  const calculateTotal = () => {
    return menu.reduce(
      (sum, item) => sum + item.price * (cart[item._id] || 0),
      0
    );
  };

  // ========== ORDER FUNCTIONS ==========
  const confirmOrder = async () => {
    const items = menu
      .filter((i) => cart[i._id])
      .map((i) => ({ ...i, qty: cart[i._id] }));

    await axios.post(`${API_URL}/order`, {
      name: user.name,
      phone: user.phone,
      regNo: user.regNo,
      items,
      total: calculateTotal(),
      paymentMethod: "UPI",
    });

    setShowOrderSuccess(true);
    setCart({});
    setShowCheckout(false);
    setPaymentStep("select");
    fetchMyOrders();
  };

  const closeSuccessPopup = () => {
    setShowOrderSuccess(false);
    setView("orders"); // redirect to orders page after placing order
  };

  const fetchMyOrders = async () => {
    if (!user) return;
    const res = await axios.get(`${API_URL}/orders/${user.phone}`);
    setMyOrders(res.data);
  };

  const fetchAllOrders = async () => {
    const res = await axios.get(`${API_URL}/all-orders`);
    setAllOrders(res.data.reverse()); // newest orders first
  };

  const markReady = async (orderId) => {
    await axios.post(`${API_URL}/order-ready`, { orderId });
    fetchAllOrders();
  };

  // ========== JSX RENDERING ==========
  return (
    <div className="container">

      {/* ---------- STUDENT LOGIN PAGE ---------- */}
      {!user && view === "login" && (
        <div className="login-wrapper">
          <div className="login-left">
            <h1>
              Engineer's
              <br />
              Point
            </h1>
          </div>
          <div className="login-right">
            <h2>Student Login</h2>
            <form onSubmit={handleStudentLogin}>
              <input name="name" placeholder="Full Name" />
              <input name="phone" type="number" placeholder="Phone Number" />
              <input name="regNo" placeholder="Registration Number" />
              <button type="submit">Enter Canteen</button>
            </form>
            <p className="hint">
              <span
                className="admin-link"
                onClick={() => setView("admin-login")}
              >
                Admin Login
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ---------- ADMIN LOGIN PAGE ---------- */}
      {!user && view === "admin-login" && (
        <div className="login-wrapper">
          <div className="login-left admin-bg">
            <h1>
              Owner
              <br />
              Panel
            </h1>
          </div>
          <div className="login-right">
            <h2>Admin Login</h2>
            <form onSubmit={handleAdminLogin}>
              <input name="adminId" placeholder="Enter Admin ID" />
              <button type="submit" className="admin-btn">
                Login as Owner
              </button>
            </form>
            <p className="hint">
              <span className="admin-link" onClick={() => setView("login")}>
                &larr; Back to Student Login
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ---------- OWNER DASHBOARD ---------- */}
      {user?.role === "owner" && (
        <div className="owner-dashboard">
          <header className="owner-header">
            <h2>Owner Dashboard</h2>
            <button onClick={handleLogout}>Logout</button>
          </header>
          <div className="orders-list">
            {allOrders.map((order) => (
              <div
                key={order._id}
                className={`owner-card ${order.status}`}
              >
                <div className="card-top">
                  <h3>
                    {order.name}{" "}
                    <small>(Reg: {order.regNo})</small>
                  </h3>
                  <span className="status-badge">{order.status}</span>
                </div>
                <p>Phone: {order.phone}</p>
                <div className="items-list">
                  {order.items.map((i, idx) => (
                    <span key={idx}>
                      {i.qty} x {i.name},{" "}
                    </span>
                  ))}
                </div>
                <p className="total">Total: Rs.{order.total}</p>
                {order.status === "Preparing" && (
                  <button
                    className="ready-btn"
                    onClick={() => markReady(order._id)}
                  >
                    Mark as Ready
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- STUDENT APP (MENU + ORDERS) ---------- */}
      {user?.role === "student" && (
        <>
          <header>
            <h1>Engineer's Point</h1>
            <div className="nav">
              <button onClick={() => setView("menu")}>Menu</button>
              <button onClick={() => setView("orders")}>My Orders</button>
              <button className="logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>

          {/* menu view */}
          {view === "menu" && (
            <div className="menu-view">
              <div className="category-tabs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={activeCategory === cat ? "active-tab" : ""}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="menu-grid">
                {(activeCategory === "All"
                  ? menu
                  : menu.filter((i) => i.category === activeCategory)
                ).map((item) => (
                  <div key={item._id} className="card">
                    <div
                      className="image-placeholder"
                      style={{
                        backgroundImage: `url(${item.image})`,
                      }}
                    ></div>
                    <h3>{item.name}</h3>
                    <p>Rs.{item.price}</p>
                    <div className="qty-controls">
                      {getQty(item._id) > 0 ? (
                        <>
                          <button
                            className="minus"
                            onClick={() => updateQty(item, -1)}
                          >
                            -
                          </button>
                          <span>{getQty(item._id)}</span>
                          <button
                            className="plus"
                            onClick={() => updateQty(item, 1)}
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <button
                          className="add-btn"
                          onClick={() => updateQty(item, 1)}
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* cart bar at bottom */}
              {Object.keys(cart).length > 0 && (
                <div className="cart-bar">
                  <div className="cart-info">
                    <span>{Object.keys(cart).length} Items</span>
                    <span className="total-price">
                      Rs.{calculateTotal()}
                    </span>
                  </div>
                  <button onClick={() => setShowCheckout(true)}>
                    Proceed
                  </button>
                </div>
              )}
            </div>
          )}

          {/* orders view */}
          {view === "orders" && (
            <div className="orders-view">
              <h2>My Orders</h2>
              {myOrders.length === 0 && <p>No orders yet</p>}
              {myOrders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <span>#{order._id.slice(-4)}</span>
                    <span
                      className={`status ${
                        order.status === "Ready" ? "ready-green" : "prep"
                      }`}
                    >
                      {order.status === "Ready"
                        ? "READY TO PICKUP"
                        : "Preparing..."}
                    </span>
                  </div>
                  <div className="order-items">
                    {order.items.map((item, i) => (
                      <span key={i}>
                        {item.qty} x {item.name},{" "}
                      </span>
                    ))}
                  </div>
                  <p>Total: Rs.{order.total}</p>
                </div>
              ))}
            </div>
          )}

          {/* payment modal */}
          {showCheckout && (
            <div className="qr-modal">
              <div className="qr-content">
                {paymentStep === "select" && (
                  <>
                    <h3>Payment Mode</h3>
                    <p>Rs.{calculateTotal()}</p>
                    <button
                      className="pay-btn upi"
                      onClick={() => setPaymentStep("UPI")}
                    >
                      Pay via UPI
                    </button>
                  </>
                )}
                {paymentStep === "UPI" && (
                  <>
                    <h3 className="upi-title">
                      NIT JAMSHEDPUR NIGHT CANTEEN
                    </h3>
                    <div className="qr-box">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=nightcanteen@nitjsr%26am=${calculateTotal()}`}
                        alt="QR Code"
                      />
                    </div>
                    <button className="confirm-btn" onClick={confirmOrder}>
                      I have Paid
                    </button>
                  </>
                )}
                <button
                  className="close-bottom-btn"
                  onClick={() => {
                    setShowCheckout(false);
                    setPaymentStep("select");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ---------- ERROR POPUPS ---------- */}

      {/* admin login error */}
      {showAdminError && (
        <div className="qr-modal">
          <div className="qr-content">
            <h3 style={{ color: "#ff4757" }}>Access Denied</h3>
            <p>The Admin ID you entered is incorrect.</p>
            <button
              className="close-bottom-btn"
              onClick={() => setShowAdminError(false)}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* phone number validation error */}
      {showPhoneError && (
        <div className="qr-modal">
          <div className="qr-content">
            <h3 style={{ color: "#ff4757" }}>Invalid Phone Number</h3>
            <p>Phone number must be exactly 10 digits.</p>
            <p style={{ marginTop: "5px", color: "#555" }}>
              Please check and try again!
            </p>
            <button
              className="close-bottom-btn"
              onClick={() => setShowPhoneError(false)}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* order placed success popup */}
      {showOrderSuccess && (
        <div className="qr-modal">
          <div className="qr-content">
            <h3 style={{ color: "#2ed573" }}>Order Placed!</h3>
            <p>Your order has been sent to the kitchen.</p>
            <button className="confirm-btn" onClick={closeSuccessPopup}>
              Track Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
