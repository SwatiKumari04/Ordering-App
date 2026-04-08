import { useState, useEffect } from "react"
import axios from "axios"
import "./index.css"

function App() {

    // checking if user is already logged in from localStorage
    const saved = localStorage.getItem("user")
    const [user, setUser] = useState(saved ? JSON.parse(saved) : null)

    // which page to show
    const [view, setView] = useState(user ? (user.role === "owner" ? "owner-dashboard" : "menu") : "login")

    // all the states we need
    const [menu, setMenu] = useState([])
    const [cart, setCart] = useState({})
    const [myOrders, setMyOrders] = useState([])
    const [allOrders, setAllOrders] = useState([])
    const [activeCategory, setActiveCategory] = useState("All")
    const [showCheckout, setShowCheckout] = useState(false)
    const [paymentStep, setPaymentStep] = useState("select")
    const [showAdminError, setShowAdminError] = useState(false)
    const [showPhoneError, setShowPhoneError] = useState(false)
    const [showOrderSuccess, setShowOrderSuccess] = useState(false)

    // all the food categories
    const categories = ["All", "Maggi", "Burgers", "Sandwich", "Rolls", "Momos", "Chinese", "Pasta", "Beverages"]

    // fetch menu on load and poll for order updates every 2 seconds
    useEffect(() => {
        axios.get("http://localhost:5000/menu").then(res => setMenu(res.data))
        const interval = setInterval(() => {
            if (user?.role === "owner") fetchAllOrders()
            if (user?.role === "student") fetchMyOrders()
        }, 2000)
        return () => clearInterval(interval)
    }, [user])

    // student login - get values from form and save to localStorage
    const handleStudentLogin = (e) => {
        e.preventDefault()
        const name = e.target.name.value
        const phone = e.target.phone.value
        const regNo = e.target.regNo.value

        if (!name || !phone || !regNo) return alert("fill all fields")
        if (phone.length !== 10) {
            setShowPhoneError(true)
            return
        }

        const userData = { name, phone, regNo, role: "student" }
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
        setView("menu")
    }

    // admin login - check if admin id is correct
    const handleAdminLogin = (e) => {
        e.preventDefault()
        const adminId = e.target.adminId.value
        if (adminId === "admin@nitjsr") {
            const userData = { name: "Owner", role: "owner" }
            setUser(userData)
            localStorage.setItem("user", JSON.stringify(userData))
            setView("owner-dashboard")
        } else {
            setShowAdminError(true)
        }
    }

    // logout - clear localStorage and go back to login
    const handleLogout = () => {
        setUser(null)
        localStorage.removeItem("user")
        setView("login")
    }

    // get quantity of item in cart
    const getQty = (id) => cart[id] || 0

    // add or remove item from cart
    const updateQty = (item, delta) => {
        const newQty = getQty(item._id) + delta
        if (newQty < 0 || newQty > 15) return
        const newCart = { ...cart }
        if (newQty === 0) {
            delete newCart[item._id]
        } else {
            newCart[item._id] = newQty
        }
        setCart(newCart)
    }

    // calculate total price of cart
    const calculateTotal = () => {
        let total = 0
        menu.forEach(item => {
            if (cart[item._id]) {
                total += item.price * cart[item._id]
            }
        })
        return total
    }

    // place order to backend
    const confirmOrder = async () => {
        const cartItems = menu.filter(i => cart[i._id])
        const items = cartItems.map(i => ({ ...i, qty: cart[i._id] }))

        await axios.post("http://localhost:5000/order", {
            name: user.name,
            phone: user.phone,
            regNo: user.regNo,
            items: items,
            total: calculateTotal(),
            paymentMethod: "UPI"
        })

        console.log("order placed")
        setShowOrderSuccess(true)
        setCart({})
        setShowCheckout(false)
        setPaymentStep("select")
        fetchMyOrders()
    }

    // close success popup and go to orders page
    const closeSuccessPopup = () => {
        setShowOrderSuccess(false)
        setView("orders")
    }

    // fetch orders for this student
    const fetchMyOrders = () => {
        if (!user) return
        axios.get("http://localhost:5000/orders/" + user.phone).then(res => setMyOrders(res.data))
    }

    // fetch all orders for owner
    const fetchAllOrders = () => {
        axios.get("http://localhost:5000/all-orders").then(res => {
            setAllOrders(res.data.reverse())
        })
    }

    // mark order as ready
    const markReady = async (orderId) => {
        await axios.post("http://localhost:5000/order-ready", { orderId })
        fetchAllOrders()
    }

    return (
        <div className="container">

            {/* student login page */}
            {!user && view === "login" && (
                <div className="login-page">
                    <h1 className="login-title">Engineer's Point</h1>
                    <h2>Student Login</h2>
                    <form onSubmit={handleStudentLogin}>
                        <input name="name" placeholder="Full Name" />
                        <input name="phone" type="number" placeholder="Phone Number" />
                        <input name="regNo" placeholder="Registration Number" />
                        <button type="submit">Enter Canteen</button>
                    </form>
                    <p className="hint"><span className="admin-link" onClick={() => setView("admin-login")}>Login as Admin</span></p>
                </div>
            )}

            {/* admin login page */}
            {!user && view === "admin-login" && (
                <div className="login-page">
                    <h1 className="login-title admin-title">Owner Panel</h1>
                    <h2>Admin Login</h2>
                    <form onSubmit={handleAdminLogin}>
                        <input name="adminId" placeholder="Enter Admin ID" />
                        <button type="submit" className="admin-btn">Login as Owner</button>
                    </form>
                    <p className="hint"><span className="admin-link" onClick={() => setView("login")}>Back to Student Login</span></p>
                </div>
            )}

            {/* owner dashboard */}
            {user?.role === "owner" && (
                <div className="owner-dashboard">
                    <header className="owner-header">
                        <h2>Owner Dashboard</h2>
                        <button onClick={handleLogout}>Logout</button>
                    </header>
                    <div className="orders-list">
                        {allOrders.map(order => (
                            <div key={order._id} className={"owner-card " + order.status}>
                                <div className="card-top">
                                    <h3>{order.name} <small>(Reg: {order.regNo})</small></h3>
                                    <span className="status-badge">{order.status}</span>
                                </div>
                                <p>Phone: {order.phone}</p>
                                <div className="items-list">
                                    {order.items.map((i, idx) => <span key={idx}>{i.qty} x {i.name}, </span>)}
                                </div>
                                <p className="total">Total: Rs.{order.total}</p>
                                {order.status === "Preparing" && (
                                    <button className="ready-btn" onClick={() => markReady(order._id)}>Mark as Ready</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* student menu and orders */}
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

                    {/* menu section */}
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
                                        <div className="image-placeholder" style={{ backgroundImage: "url(" + item.image + ")" }}></div>
                                        <h3>{item.name}</h3>
                                        <p>Rs.{item.price}</p>
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
                            {/* cart bar at bottom */}
                            {Object.keys(cart).length > 0 && (
                                <div className="cart-bar">
                                    <div className="cart-info">
                                        <span>{Object.keys(cart).length} Items</span>
                                        <span className="total-price">Rs.{calculateTotal()}</span>
                                    </div>
                                    <button onClick={() => setShowCheckout(true)}>Proceed</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* my orders section */}
                    {view === "orders" && (
                        <div className="orders-view">
                            <h2>My Orders</h2>
                            {myOrders.map(order => (
                                <div key={order._id} className="order-card">
                                    <div className="order-header">
                                        <span>#{order._id.slice(-4)}</span>
                                        <span className={"status " + (order.status === "Ready" ? "ready-green" : "prep")}>
                                            {order.status === "Ready" ? "READY TO PICKUP" : "Preparing..."}
                                        </span>
                                    </div>
                                    <div className="order-items">
                                        {order.items.map((item, i) => <span key={i}>{item.qty} x {item.name}, </span>)}
                                    </div>
                                    <p>Total: Rs.{order.total}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* checkout/payment popup */}
                    {showCheckout && (
                        <div className="qr-modal">
                            <div className="qr-content">
                                {paymentStep === "select" && <>
                                    <h3>Payment Mode</h3>
                                    <p>Rs.{calculateTotal()}</p>
                                    <button className="pay-btn upi" onClick={() => setPaymentStep("UPI")}>Pay via UPI</button>
                                </>}
                                {paymentStep === "UPI" && <>
                                    <h3 className="upi-title">NIT JAMSHEDPUR NIGHT CANTEEN</h3>
                                    <div className="qr-box">
                                        <img src={"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=nightcanteen@nitjsr%26am=" + calculateTotal()} alt="QR" />
                                    </div>
                                    <button className="confirm-btn" onClick={confirmOrder}>I have Paid</button>
                                </>}
                                <button className="close-bottom-btn" onClick={() => { setShowCheckout(false); setPaymentStep("select") }}>Cancel</button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* admin error popup */}
            {showAdminError && (
                <div className="qr-modal">
                    <div className="qr-content">
                        <h3 style={{ color: "#ff4757" }}>Access Denied</h3>
                        <p>The Admin ID you entered is incorrect.</p>
                        <button className="close-bottom-btn" onClick={() => setShowAdminError(false)}>Try Again</button>
                    </div>
                </div>
            )}

            {/* phone error popup */}
            {showPhoneError && (
                <div className="qr-modal">
                    <div className="qr-content">
                        <h3 style={{ color: "#ff4757" }}>Invalid Phone Number</h3>
                        <p>Phone number must be exactly 10 digits.</p>
                        <p style={{ marginTop: "5px", color: "#555" }}>To remind you if you forget !!</p>
                        <button className="close-bottom-btn" onClick={() => setShowPhoneError(false)}>Try Again</button>
                    </div>
                </div>
            )}

            {/* order success popup */}
            {showOrderSuccess && (
                <div className="qr-modal">
                    <div className="qr-content">
                        <h3 style={{ color: "#2ed573" }}>Order Placed!</h3>
                        <p>Your order has been sent to the kitchen.</p>
                        <button className="confirm-btn" onClick={closeSuccessPopup}>Track Order</button>
                    </div>
                </div>
            )}

        </div>
    )
}

export default App
