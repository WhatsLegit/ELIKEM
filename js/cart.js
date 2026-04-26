// Cart Module - localStorage + Firestore Orders
import { db, collections } from './firebase.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let cart = JSON.parse(localStorage.getItem('cart')) || [];

export function getCart() { return cart; }

export function addToCart(productId, quantity) {
  if (quantity === undefined) quantity = 1;
  const product = window._allProducts ? window._allProducts.find(function(p) { return p.id === productId; }) : null;
  if (!product) { alert('Product not found. Please refresh and try again.'); return; }

  const existing = cart.find(function(item) { return item.id === productId; });
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push(Object.assign({}, product, { quantity: quantity }));
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  showToast(product.name + ' added to cart');
}

export function removeFromCart(productId) {
  cart = cart.filter(function(item) { return item.id !== productId; });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

export function updateQuantity(productId, quantity) {
  const item = cart.find(function(item) { return item.id === productId; });
  if (!item) return;
  item.quantity = parseInt(quantity);
  if (item.quantity <= 0) {
    removeFromCart(productId);
  } else {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
  }
}

export function updateCartUI() {
  // Cart count badge (desktop nav)
  const cartCount = document.querySelector('.cart-count');
  if (cartCount) {
    cartCount.textContent = cart.reduce(function(s, i) { return s + i.quantity; }, 0);
  }

  // ── Desktop table ──
  const tbody = document.getElementById('cartContainer');
  if (tbody) {
    if (cart.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:3rem;color:#888;">Your cart is empty. <a href="shop.html" style="color:#111;font-weight:600;">Shop now</a></td></tr>';
    } else {
      var rows = '';
      cart.forEach(function(item) {
        var img       = item.image || 'https://via.placeholder.com/50x50?text=+';
        var price     = '$' + parseFloat(item.price).toFixed(2);
        var lineTotal = '$' + (item.price * item.quantity).toFixed(2);
        rows += '<tr>';
        rows += '<td><img src="' + img + '" width="50" height="50" style="border-radius:8px;object-fit:cover;" alt="' + item.name + '"></td>';
        rows += '<td style="font-weight:500;">' + item.name + '</td>';
        rows += '<td>' + price + '</td>';
        rows += '<td><input type="number" value="' + item.quantity + '" min="1" onchange="updateQuantity(\'' + item.id + '\', this.value)" style="width:65px;padding:0.4rem;border:1px solid rgba(0,0,0,0.15);border-radius:8px;text-align:center;font-family:inherit;"></td>';
        rows += '<td style="font-weight:600;">' + lineTotal + '</td>';
        rows += '<td><button onclick="removeFromCart(\'' + item.id + '\')" style="background:transparent;border:1px solid rgba(0,0,0,0.15);border-radius:8px;padding:0.4rem 0.8rem;cursor:pointer;font-size:0.85rem;color:#555;font-family:inherit;">Remove</button></td>';
        rows += '</tr>';
      });
      tbody.innerHTML = rows;
    }
  }

  // ── Mobile card list ──
  const cardList = document.getElementById('cartCardList');
  if (cardList) {
    if (cart.length === 0) {
      cardList.innerHTML = '<div style="text-align:center;padding:2.5rem;color:#888;background:rgba(255,255,255,0.85);border-radius:16px;">Your cart is empty. <a href="shop.html" style="color:#2563EB;font-weight:600;">Shop now</a></div>';
    } else {
      var cards = '';
      cart.forEach(function(item) {
        var img       = item.image || 'https://via.placeholder.com/64x64?text=+';
        var price     = '$' + parseFloat(item.price).toFixed(2);
        var lineTotal = '$' + (item.price * item.quantity).toFixed(2);
        cards += '<div class="cart-item-card">';
        cards += '<img src="' + img + '" alt="' + item.name + '">';
        cards += '<div class="cart-item-info">';
        cards += '<div class="cart-item-name">' + item.name + '</div>';
        cards += '<div class="cart-item-price">' + price + ' each</div>';
        cards += '<div class="cart-item-controls">';
        cards += '<input type="number" value="' + item.quantity + '" min="1" onchange="updateQuantity(\'' + item.id + '\', this.value)">';
        cards += '<button class="cart-remove-btn" onclick="removeFromCart(\'' + item.id + '\')" aria-label="Remove">';
        cards += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
        cards += '</button>';
        cards += '</div></div>';
        cards += '<div class="cart-item-total">' + lineTotal + '</div>';
        cards += '</div>';
      });
      cardList.innerHTML = cards;
    }
  }

  // Total
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) {
    var total = cart.reduce(function(s, i) { return s + (i.price * i.quantity); }, 0);
    totalEl.textContent = '$' + total.toFixed(2);
  }
}

export async function checkout(formData) {
  if (cart.length === 0) throw new Error('Your cart is empty');
  const order = Object.assign({}, formData, {
    items: cart,
    total: cart.reduce(function(s, i) { return s + (i.price * i.quantity); }, 0),
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  await addDoc(collection(db, collections.orders), order);
  cart = [];
  localStorage.removeItem('cart');
  updateCartUI();
}

function showToast(message) {
  var toast = document.getElementById('cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.style.cssText = 'position:fixed;bottom:100px;right:20px;background:#111;color:#fff;padding:0.8rem 1.2rem;border-radius:12px;font-size:0.88rem;font-family:inherit;z-index:9999;opacity:0;transition:opacity 0.3s ease;pointer-events:none;max-width:240px;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function() { toast.style.opacity = '0'; }, 2500);
}

document.addEventListener('DOMContentLoaded', updateCartUI);
