// Products Module
import { db, collections } from './firebase.js';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── Cloudinary config ──
const CLOUDINARY_CLOUD_NAME = 'dfajt5l0p';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/' + CLOUDINARY_CLOUD_NAME + '/image/upload';

async function uploadToCloudinary(imageFile) {
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'elikemdots/products');
  const response = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
  if (!response.ok) {
    const err = await response.json();
    throw new Error('Cloudinary upload failed: ' + (err.error ? err.error.message : response.statusText));
  }
  const data = await response.json();
  return data.secure_url;
}

// ── Product state ──
let allProducts = [];

// ── Load & display products ──
export async function loadProducts(category, search) {
  if (category === undefined) category = null;
  if (search === undefined) search = '';
  try {
    const constraints = [orderBy('createdAt', 'desc')];
    if (category) constraints.push(where('category', '==', category));

    const snapshot = await getDocs(query(collection(db, collections.products), ...constraints));
    allProducts = snapshot.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    window._allProducts = allProducts;

    let filtered = allProducts;
    if (search) {
      const term = search.toLowerCase();
      filtered = allProducts.filter(function(p) {
        return p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term);
      });
    }
    displayProducts(filtered);
  } catch (error) {
    console.error('Error loading products:', error);
    const container = document.getElementById('productsContainer') || document.querySelector('.product-grid');
    if (container) {
      container.innerHTML = '<p style="text-align:center;color:#888;padding:2rem;grid-column:1/-1;">Could not load products.</p>';
    }
  }
}

function displayProducts(products) {
  const container = document.getElementById('productsContainer') || document.querySelector('.product-grid');
  if (!container) return;

  if (!products.length) {
    container.innerHTML = '<p style="text-align:center;color:#888;padding:2rem;grid-column:1/-1;">No products found.</p>';
    return;
  }

  var html = '';
  products.forEach(function(p) {
    var img   = p.image || 'https://via.placeholder.com/300x200?text=Product';
    var price = '$' + parseFloat(p.price).toFixed(2);
    var desc  = p.description || '';
    var short = desc.length > 70 ? desc.substring(0, 70) + '...' : desc;
    var hasMore = desc.length > 70;
    var safeDesc  = desc.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
    var safeShort = short.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    html += '<div class="product-card glass-hover" style="display:flex;flex-direction:column;">';
    html += '<img src="' + img + '" alt="' + p.name + '" loading="lazy" onerror="this.src=\'https://via.placeholder.com/300x200?text=No+Image\'">';
    html += '<h3 style="margin-bottom:0.3rem;">' + p.name + '</h3>';
    html += '<p style="font-size:1.05rem;font-weight:700;color:#111;margin:0.2rem 0;">' + price + '</p>';
    html += '<p style="font-size:0.75rem;color:#aaa;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.5px;">' + p.category + '</p>';

    if (desc) {
      html += '<div style="flex:1;margin-bottom:0.8rem;">';
      html += '<p id="desc-' + p.id + '" style="font-size:0.82rem;color:#555;line-height:1.6;margin:0;">' + short + '</p>';
      if (hasMore) {
        html += '<button onclick="(function(b,id,full,sh){';
        html += 'var el=document.getElementById(\'desc-\'+id);';
        html += 'if(b.dataset.open===\'1\'){el.textContent=sh;b.textContent=\'View details\';b.dataset.open=\'0\';}';
        html += 'else{el.textContent=full;b.textContent=\'Show less\';b.dataset.open=\'1\';}';
        html += '})(this,\'' + p.id + '\',\'' + safeDesc + '\',\'' + safeShort + '\')"';
        html += ' data-open="0" style="background:none;border:none;color:#2563EB;font-size:0.78rem;font-weight:600;cursor:pointer;padding:2px 0;font-family:inherit;display:block;margin-top:3px;">View details</button>';
      }
      html += '</div>';
    }

    html += '<button onclick="addToCart(\'' + p.id + '\')" class="btn" style="width:100%;padding:0.7rem;margin-top:auto;">Add to Cart</button>';
    html += '<button onclick="window.viewProductDetails(\'' + p.id + '\')" style="width:100%;background:none;border:1px solid rgba(0,0,0,0.15);border-radius:50px;padding:0.6rem;margin-top:0.5rem;font-size:0.82rem;font-weight:600;color:#555;cursor:pointer;font-family:inherit;transition:all 0.2s;" onmouseover="this.style.borderColor=\'#2563EB\';this.style.color=\'#2563EB\'" onmouseout="this.style.borderColor=\'rgba(0,0,0,0.15)\';this.style.color=\'#555\'">View Details</button>';
    html += '</div>';
  });

  container.innerHTML = html;
}

// ── Admin CRUD ──
export async function addProduct(name, category, description, price, imageFile, dbInstance) {
  var imageUrl = '';
  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadToCloudinary(imageFile);
  }
  const database = dbInstance || db;
  await addDoc(collection(database, collections.products), {
    name: name,
    category: category,
    description: description,
    price: parseFloat(price),
    image: imageUrl,
    createdAt: new Date().toISOString()
  });
  loadProducts();
}

export async function updateProduct(id, updates, imageFile, dbInstance) {
  if (imageFile && imageFile.size > 0) {
    updates.image = await uploadToCloudinary(imageFile);
  }
  const database = dbInstance || db;
  await updateDoc(doc(database, collections.products, id), updates);
  loadProducts();
}

export async function deleteProduct(id, dbInstance) {
  const database = dbInstance || db;
  await deleteDoc(doc(database, collections.products, id));
  loadProducts();
}

export function getProductById(id) {
  return allProducts.find(function(p) { return p.id === id; }) || null;
}

// ── Product Detail Modal ──
function ensureProductModal() {
  if (document.getElementById('productModal')) return;
  var modal = document.createElement('div');
  modal.id = 'productModal';
  modal.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);z-index:3000;align-items:center;justify-content:center;padding:1rem;';
  modal.innerHTML = '<div style="background:#fff;border-radius:24px;max-width:480px;width:100%;max-height:90vh;overflow:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
    '<button id="closeProductModal" style="position:absolute;top:1rem;right:1rem;background:rgba(0,0,0,0.05);border:none;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.2rem;display:flex;align-items:center;justify-content:center;z-index:10;">×</button>' +
    '<img id="modalImg" src="" alt="" style="width:100%;height:260px;object-fit:cover;border-radius:24px 24px 0 0;">' +
    '<div style="padding:1.5rem;">' +
      '<span id="modalCategory" style="font-size:0.75rem;color:#2563EB;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;"></span>' +
      '<h2 id="modalName" style="margin:0.5rem 0 0.3rem;font-size:1.4rem;color:#111;"></h2>' +
      '<p id="modalPrice" style="font-size:1.25rem;font-weight:700;color:#111;margin-bottom:1rem;"></p>' +
      '<p id="modalDesc" style="color:#555;line-height:1.7;margin-bottom:1.5rem;"></p>' +
      '<button id="modalAddToCart" class="btn" style="width:100%;padding:0.9rem;">Add to Cart</button>' +
    '</div>' +
  '</div>';
  document.body.appendChild(modal);

  document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
  modal.addEventListener('click', function(e) { if (e.target === modal) closeProductModal(); });
}

window.viewProductDetails = function(productId) {
  var product = getProductById(productId);
  if (!product) { console.error('Product not found:', productId); return; }

  ensureProductModal();

  document.getElementById('modalImg').src = product.image || 'https://via.placeholder.com/400x300?text=No+Image';
  document.getElementById('modalImg').alt = product.name;
  document.getElementById('modalCategory').textContent = product.category || '';
  document.getElementById('modalName').textContent = product.name;
  document.getElementById('modalPrice').textContent = '$' + parseFloat(product.price).toFixed(2);
  document.getElementById('modalDesc').textContent = product.description || 'No description available.';
  document.getElementById('modalAddToCart').onclick = function() {
    if (window.addToCart) { window.addToCart(productId); closeProductModal(); }
    else { alert('Cart not loaded yet. Please try again.'); }
  };

  var modal = document.getElementById('productModal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

window.closeProductModal = function() {
  var modal = document.getElementById('productModal');
  if (modal) { modal.style.display = 'none'; document.body.style.overflow = ''; }
};
