/* script.js - handles products, cart, signup/login using localStorage */

/* ---------- Data: product catalogue (hard-coded) ---------- */
const PRODUCTS = [
  {
    id: "p1",
    name: "SUGED Pure Jaggery Powder - 500g",
    price: 120,
    img: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=800&auto=format&fit=crop&crop=entropy",
    short: "Natural, unrefined jaggery powder. No preservatives.",
    desc: "SUGED jaggery is made from pure sugarcane juice, concentrated and dried using traditional methods. Ideal replacement for white sugar."
  },
  {
    id: "p2",
    name: "SUGED Pure Jaggery Powder - 1kg",
    price: 220,
    img: "https://images.unsplash.com/photo-1543353071-087092ec3938?q=80&w=800&auto=format&fit=crop&crop=entropy",
    short: "Family pack - economical and fresh.",
    desc: "Bulk pack for daily use, sweets and recipes. Store in a cool, dry place."
  }
];

/* ---------- Utility: localStorage wrappers ---------- */
const storage = {
  getCart(){
    try { return JSON.parse(localStorage.getItem('suged_cart') || '[]'); }
    catch { return []; }
  },
  saveCart(cart){ localStorage.setItem('suged_cart', JSON.stringify(cart)); },
  getUsers(){
    try { return JSON.parse(localStorage.getItem('suged_users') || '{}'); }
    catch { return {}; }
  },
  saveUsers(users){ localStorage.setItem('suged_users', JSON.stringify(users)); },
  getSession(){ return JSON.parse(localStorage.getItem('suged_session') || 'null'); },
  saveSession(u){ localStorage.setItem('suged_session', JSON.stringify(u)); }
};

/* ---------- Cart functions ---------- */
function addToCart(productId, qty = 1){
  const cart = storage.getCart();
  const idx = cart.findIndex(c => c.id === productId);
  if(idx >= 0) cart[idx].qty += qty;
  else cart.push({ id: productId, qty });
  storage.saveCart(cart);
  alert('Added to cart');
  renderCartCount();
}

function updateCartItem(productId, qty){
  const cart = storage.getCart();
  const idx = cart.findIndex(c => c.id === productId);
  if(idx >= 0){
    if(qty <= 0) cart.splice(idx,1);
    else cart[idx].qty = qty;
    storage.saveCart(cart);
  }
  renderCartCount();
  if(typeof renderCartPage === 'function') renderCartPage();
}

function clearCart(){
  storage.saveCart([]);
  renderCartCount();
  if(typeof renderCartPage === 'function') renderCartPage();
}

/* ---------- UI helpers ---------- */
function formatPrice(x){ return "₹" + Number(x).toLocaleString('en-IN'); }

function renderCartCount(){
  const cart = storage.getCart();
  const count = cart.reduce((s,i)=>s+i.qty,0);
  const el = document.getElementById('cart-count');
  if(el) el.textContent = count;
}

/* ---------- Product listing rendering (index) ---------- */
function renderProductsList(containerId = 'products-list'){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = '';
  PRODUCTS.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p class="small">${p.short}</p>
      <div class="row">
        <div>
          <div class="price">${formatPrice(p.price)}</div>
        </div>
        <div>
          <button class="btn btn-outline" onclick="location.href='product.html?id=${p.id}'">View</button>
          <button class="btn btn-primary" onclick="addToCart('${p.id}')">Add</button>
        </div>
      </div>
    `;
    el.appendChild(card);
  });
}

/* ---------- Product detail (product.html) ---------- */
function renderProductDetail(){
  const q = new URLSearchParams(location.search);
  const id = q.get('id') || 'p1';
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  const el = document.getElementById('product-detail');
  if(!el) return;
  el.innerHTML = `
    <div class="hero">
      <img src="${p.img}" alt="${p.name}">
      <div class="lead">
        <h1>${p.name}</h1>
        <p class="small">${p.desc}</p>
        <div style="margin-top:12px">
          <strong class="price">${formatPrice(p.price)}</strong>
        </div>
        <div style="margin-top:14px">
          <input id="qty" type="number" value="1" min="1" style="width:90px;padding:8px;border-radius:6px;border:1px solid #eee">
          <button class="btn btn-primary" onclick="addFromDetail('${p.id}')">Add to cart</button>
        </div>
      </div>
    </div>
  `;
}

function addFromDetail(id){
  const qty = parseInt(document.getElementById('qty').value) || 1;
  addToCart(id, qty);
}

/* ---------- Cart page rendering (cart.html) ---------- */
function renderCartPage(){
  const el = document.getElementById('cart-area');
  if(!el) return;
  const cart = storage.getCart();
  if(cart.length===0){
    el.innerHTML = `<div class="form"><p>Your cart is empty. Go to <a href="index.html">home</a> to add products.</p></div>`;
    return;
  }
  let html = `<div class="form"><table class="table"><thead><tr><th>Product</th><th>Price</th><th class="qty">Qty</th><th>Total</th></tr></thead><tbody>`;
  let grand = 0;
  cart.forEach(item=>{
    const p = PRODUCTS.find(x=>x.id===item.id);
    if(!p) return;
    const total = p.price * item.qty; grand += total;
    html += `<tr>
      <td>
        <strong>${p.name}</strong><div class="small">${p.short}</div>
      </td>
      <td>${formatPrice(p.price)}</td>
      <td>
        <input type="number" class="cart-qty" data-id="${item.id}" value="${item.qty}" min="0" style="width:70px;padding:6px;border-radius:6px;border:1px solid #eee">
      </td>
      <td>${formatPrice(total)}</td>
    </tr>`;
  });
  html += `</tbody></table>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
      <div>
        <button class="btn btn-outline" onclick="clearCart()">Clear Cart</button>
      </div>
      <div>
        <strong>Total: ${formatPrice(grand)}</strong>
        <button class="btn btn-primary" onclick="proceedToCheckout(${grand})">Proceed to Checkout</button>
      </div>
    </div>
  </div>`;
  el.innerHTML = html;

  // attach qty change handlers
  document.querySelectorAll('.cart-qty').forEach(input=>{
    input.addEventListener('change', (e)=>{
      const id = e.target.dataset.id;
      const qty = parseInt(e.target.value) || 0;
      updateCartItem(id, qty);
    });
  });
}

/* ---------- Checkout simulation ---------- */
function proceedToCheckout(amount){
  const session = storage.getSession();
  if(!session){
    if(confirm('You are not logged in. Do you want to login/sign up now?')){
      location.href = 'signup.html';
      return;
    } else {
      return;
    }
  }
  // Save a mock order (in localStorage) and go to confirmation page
  const orders = JSON.parse(localStorage.getItem('suged_orders') || '[]');
  const cart = storage.getCart();
  const order = {
    id: 'ORD' + Date.now(),
    user: session.email,
    items: cart,
    amount,
    date: new Date().toISOString()
  };
  orders.push(order);
  localStorage.setItem('suged_orders', JSON.stringify(orders));
  clearCart();
  location.href = `order.html?id=${order.id}`;
}

/* ---------- Signup & login ---------- */
function signupUser(){
  const name = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim().toLowerCase();
  const pass = document.getElementById('su-pass').value;
  if(!name || !email || !pass){ alert('Please fill all fields'); return; }
  const users = storage.getUsers();
  if(users[email]) { alert('User already exists. Please login.'); return; }
  users[email] = { name, email, pass };
  storage.saveUsers(users);
  storage.saveSession({ name, email });
  alert('Sign up successful');
  location.href = 'index.html';
}

function loginUser(){
  const email = document.getElementById('li-email').value.trim().toLowerCase();
  const pass = document.getElementById('li-pass').value;
  const users = storage.getUsers();
  const u = users[email];
  if(!u || u.pass !== pass){ alert('Invalid credentials'); return; }
  storage.saveSession({ name: u.name, email: u.email });
  alert('Logged in');
  location.href = 'index.html';
}

function logout(){
  storage.saveSession(null);
  alert('Logged out');
  location.href = 'index.html';
}

/* ---------- Order detail page ---------- */
function renderOrderDetail(){
  const q = new URLSearchParams(location.search);
  const id = q.get('id');
  const orders = JSON.parse(localStorage.getItem('suged_orders') || '[]');
  const o = orders.find(x=>x.id===id);
  const el = document.getElementById('order-detail');
  if(!el) return;
  if(!o){ el.innerHTML = `<div class="form"><p>Order not found.</p></div>`; return; }
  let html = `<div class="form"><h3>Order ${o.id}</h3><p class="small">Placed on ${new Date(o.date).toLocaleString()}</p><table class="table"><thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead><tbody>`;
  let total = 0;
  o.items.forEach(it=>{
    const p = PRODUCTS.find(x=>x.id===it.id);
    if(!p) return;
    html += `<tr><td>${p.name}</td><td>${it.qty}</td><td>${formatPrice(p.price * it.qty)}</td></tr>`;
    total += p.price * it.qty;
  });
  html += `</tbody></table><div style="margin-top:12px"><strong>Total: ${formatPrice(total)}</strong></div></div>`;
  el.innerHTML = html;
}

/* ---------- page initializer ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  renderCartCount();
  // call page-specific renders if they exist
  if(typeof renderProductsList === 'function') renderProductsList();
  if(typeof renderProductDetail === 'function') renderProductDetail();
  if(typeof renderCartPage === 'function') renderCartPage();
  if(typeof renderOrderDetail === 'function') renderOrderDetail();

  // show login status
  const sess = storage.getSession();
  const userEl = document.getElementById('user-name');
  if(userEl){
    if(sess) userEl.innerHTML = `${sess.name} · <a href="#" onclick="logout()">Logout</a>`;
    else userEl.innerHTML = `<a href="login.html">Login</a> · <a href="signup.html">Sign up</a>`;
  }
});

