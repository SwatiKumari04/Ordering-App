import { useState, useEffect } from "react"
import axios from "axios"
import "./index.css"

var BASE = "http://localhost:5000"

function App() {

  var saved = localStorage.getItem("user")
  var parsed = saved ? JSON.parse(saved) : null
  var [user, setUser] = useState(parsed)

  var startView = "login"
  if(parsed && parsed.role == "owner") startView = "owner-dashboard"
  if(parsed && parsed.role == "student") startView = "menu"
  var [view, setView] = useState(startView)

  var [menu, setMenu] = useState([])
  var [cart, setCart] = useState({})
  var [myOrders, setMyOrders] = useState([])
  var [allOrders, setAllOrders] = useState([])
  var [activeCat, setActiveCat] = useState("All")
  var [checkout, setCheckout] = useState(false)
  var [payMode, setPayMode] = useState("select")
  var [popups, setPopups] = useState({ admin: false, phone: false, success: false })

  var tabs = ["All","Maggi","Burgers","Sandwich","Rolls","Momos","Chinese","Pasta","Beverages"]

  useEffect(function(){
    axios.get(BASE + "/menu").then(function(r){ setMenu(r.data) })
    // polling so we can see status changes live
    var t = setInterval(function(){
      if(user != null && user.role == "owner") pullAllOrders()
      if(user != null && user.role == "student") pullMyOrders()
    }, 2000)
    return function(){ clearInterval(t) }
  }, [user])

  function studentLogin(e){
    e.preventDefault()
    var n = e.target.name.value
    var p = e.target.phone.value
    var r = e.target.regNo.value
    if(n == "" || p == "" || r == ""){
      alert("Please fill all fields")
      return
    }
    if(p.length != 10){
      setPopups(Object.assign({}, popups, { phone: true }))
      return
    }
    var d = { name: n, phone: p, regNo: r, role: "student" }
    localStorage.setItem("user", JSON.stringify(d))
    setUser(d)
    setView("menu")
  }

  function adminLogin(e){
    e.preventDefault()
    if(e.target.adminId.value == "admin@nitjsr"){
      var d = { name: "Owner", role: "owner" }
      localStorage.setItem("user", JSON.stringify(d))
      setUser(d)
      setView("owner-dashboard")
    } else {
      setPopups(Object.assign({}, popups, { admin: true }))
    }
  }

  function doLogout(){
    localStorage.removeItem("user")
    setUser(null)
    setView("login")
  }

  function inCart(id){ return cart[id] ? cart[id] : 0 }

  function changeQty(itm, diff){
    var nv = inCart(itm._id) + diff
    if(nv < 0) return
    if(nv > 15) return
    var c = Object.assign({}, cart)
    if(nv == 0) delete c[itm._id]
    else c[itm._id] = nv
    setCart(c)
  }

  function billTotal(){
    var money = 0
    for(var k = 0; k < menu.length; k++){
      var cur = menu[k]
      if(cart[cur._id]) money += cur.price * cart[cur._id]
    }
    return money
  }

  function sendOrder(){
    var arr = []
    for(var k in cart){
      for(var j = 0; j < menu.length; j++){
        if(menu[j]._id == k){
          var copy = Object.assign({}, menu[j])
          copy.qty = cart[k]
          arr.push(copy)
        }
      }
    }
    var payload = {
      name: user.name, phone: user.phone, regNo: user.regNo,
      items: arr, total: billTotal(), paymentMethod: "UPI"
    }
    axios.post(BASE + "/order", payload).then(function(){
      console.log("order placed")
      setPopups(Object.assign({}, popups, { success: true }))
      setCart({})
      setCheckout(false)
      setPayMode("select")
      pullMyOrders()
    })
  }

  function pullMyOrders(){
    if(!user) return
    axios.get(BASE + "/orders/" + user.phone).then(function(r){ setMyOrders(r.data) })
  }

  function pullAllOrders(){
    axios.get(BASE + "/all-orders").then(function(r){
      var copy = r.data.slice()
      copy.reverse()
      setAllOrders(copy)
    })
  }

  function markDone(id){
    axios.post(BASE + "/order-ready", { orderId: id }).then(function(){ pullAllOrders() })
  }

  var numItems = Object.keys(cart).length

  var filteredMenu = menu
  if(activeCat != "All"){
    filteredMenu = []
    for(var z = 0; z < menu.length; z++){
      if(menu[z].category == activeCat) filteredMenu.push(menu[z])
    }
  }

  function showPopup(type, title, color, msg, btnText, extra){
    if(!popups[type]) return null
    return <div className="qr-modal"><div className="qr-content">
      <h3 style={{color: color}}>{title}</h3>
      <p>{msg}</p>
      {extra ? extra : null}
      <button className="close-bottom-btn" onClick={function(){ var p = Object.assign({}, popups); p[type] = false; setPopups(p) }}>{btnText}</button>
    </div></div>
  }

  return (
    <div className="container">

      {!user && view == "login" && <div className="login-page">
        <h1 className="login-title">Engineer's Point</h1>
        <h2>Student Login</h2>
        <form onSubmit={studentLogin}>
          <input name="name" placeholder="Full Name" />
          <input name="phone" type="number" placeholder="Phone Number" />
          <input name="regNo" placeholder="Registration Number" />
          <button type="submit">Enter Canteen</button>
        </form>
        <p className="hint"><span className="admin-link" onClick={function(){ setView("admin-login") }}>Login as Admin</span></p>
      </div>}

      {!user && view == "admin-login" && <div className="login-page">
        <h1 className="login-title admin-title">Owner Panel</h1>
        <h2>Admin Login</h2>
        <form onSubmit={adminLogin}>
          <input name="adminId" placeholder="Enter Admin ID" />
          <button type="submit" className="admin-btn">Login as Owner</button>
        </form>
        <p className="hint"><span className="admin-link" onClick={function(){ setView("login") }}>Back to Student Login</span></p>
      </div>}

      {user != null && user.role == "owner" && <div className="owner-dashboard">
        <header className="owner-header">
          <h2>Owner Dashboard</h2>
          <button onClick={doLogout}>Logout</button>
        </header>
        <div className="orders-list">
          {allOrders.map(function(ord, i){
            return <div key={ord._id} className={"owner-card " + ord.status}>
              <div className="card-top">
                <h3>{ord.name} <small>(Reg: {ord.regNo})</small></h3>
                <span className="status-badge">{ord.status}</span>
              </div>
              <p>Phone: {ord.phone}</p>
              <div className="items-list">
                {ord.items.map(function(x,j){ return <span key={j}>{x.qty} x {x.name}, </span> })}
              </div>
              <p className="total">Total: Rs.{ord.total}</p>
              {ord.status == "Preparing" ? <button className="ready-btn" onClick={function(){ markDone(ord._id) }}>Mark as Ready</button> : null}
            </div>
          })}
        </div>
      </div>}

      {user != null && user.role == "student" && <>
        <header>
          <h1>Engineer's Point</h1>
          <div className="nav">
            <button onClick={function(){ setView("menu") }}>Menu</button>
            <button onClick={function(){ setView("orders") }}>My Orders</button>
            <button className="logout" onClick={doLogout}>Logout</button>
          </div>
        </header>

        {view == "menu" && <div className="menu-view">
          <div className="category-tabs">
            {tabs.map(function(t){ return <button key={t} className={activeCat == t ? "active-tab" : ""} onClick={function(){ setActiveCat(t) }}>{t}</button> })}
          </div>
          <div className="menu-grid">
            {filteredMenu.map(function(item){
              return <div key={item._id} className="card">
                <div className="image-placeholder" style={{backgroundImage: "url(" + item.image + ")"}}></div>
                <h3>{item.name}</h3>
                <p>Rs.{item.price}</p>
                <div className="qty-controls">
                  {inCart(item._id) > 0 ? <>
                    <button className="minus" onClick={function(){ changeQty(item, -1) }}>-</button>
                    <span>{inCart(item._id)}</span>
                    <button className="plus" onClick={function(){ changeQty(item, 1) }}>+</button>
                  </> : <button className="add-btn" onClick={function(){ changeQty(item, 1) }}>ADD</button>}
                </div>
              </div>
            })}
          </div>
          {numItems > 0 ? <div className="cart-bar">
            <div className="cart-info">
              <span>{numItems} Items</span>
              <span className="total-price">Rs.{billTotal()}</span>
            </div>
            <button onClick={function(){ setCheckout(true) }}>Proceed</button>
          </div> : null}
        </div>}

        {view == "orders" && <div className="orders-view">
          <h2>My Orders</h2>
          {myOrders.map(function(o, i){
            var isReady = o.status == "Ready"
            return <div key={o._id} className="order-card">
              <div className="order-header">
                <span>#{o._id.slice(-4)}</span>
                <span className={"status " + (isReady ? "ready-green" : "prep")}>{isReady ? "READY TO PICKUP" : "Preparing..."}</span>
              </div>
              <div className="order-items">
                {o.items.map(function(x,j){ return <span key={j}>{x.qty} x {x.name}, </span> })}
              </div>
              <p>Total: Rs.{o.total}</p>
            </div>
          })}
        </div>}

        {checkout && <div className="qr-modal"><div className="qr-content">
          {payMode == "select" ? <div>
            <h3>Payment Mode</h3>
            <p>Rs.{billTotal()}</p>
            <button className="pay-btn upi" onClick={function(){ setPayMode("UPI") }}>Pay via UPI</button>
          </div> : null}
          {payMode == "UPI" ? <div>
            <h3 className="upi-title">NIT JAMSHEDPUR NIGHT CANTEEN</h3>
            <div className="qr-box">
              <img src={"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=nightcanteen@nitjsr%26am=" + billTotal()} alt="QR" />
            </div>
            <button className="confirm-btn" onClick={sendOrder}>I have Paid</button>
          </div> : null}
          <button className="close-bottom-btn" onClick={function(){ setCheckout(false); setPayMode("select") }}>Cancel</button>
        </div></div>}
      </>}

      {showPopup("admin", "Access Denied", "#ff4757", "The Admin ID you entered is incorrect.", "Try Again", null)}
      {showPopup("phone", "Invalid Phone Number", "#ff4757", "Phone number must be exactly 10 digits.", "Try Again",
        <p style={{marginTop:"5px", color:"#555"}}>To remind you if you forget !!</p>
      )}

      {popups.success ? <div className="qr-modal"><div className="qr-content">
        <h3 style={{color:"#2ed573"}}>Order Placed!</h3>
        <p>Your order has been sent to the kitchen.</p>
        <button className="confirm-btn" onClick={function(){ setPopups(Object.assign({}, popups, {success:false})); setView("orders") }}>Track Order</button>
      </div></div> : null}

    </div>
  )
}

export default App
