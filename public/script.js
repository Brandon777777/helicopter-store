// ============================================================
// SCRIPT.JS — Helicopter Store — Lógica global compartida
// ============================================================

// ─── Utilidades globales ──────────────────────────────────────

/**
 * Formatea un número como precio en USD
 */
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Muestra un toast (notificación flotante)
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: '🔔' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ─── Loader ───────────────────────────────────────────────────
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 600);
  }
});

// ─── Navbar: marcar página activa ────────────────────────────
function initNavbar() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Hamburger
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  updateBadges();
}

// ─── Badges del navbar ────────────────────────────────────────
function updateBadges() {
  const cart     = getCart();
  const favs     = getFavorites();
  const cartBadge = document.getElementById('cart-badge');
  const favBadge  = document.getElementById('fav-badge');
  if (cartBadge) cartBadge.textContent = cart.length;
  if (favBadge)  favBadge.textContent  = favs.length;
}

// ─── LocalStorage: Carrito ────────────────────────────────────
function getCart() {
  return JSON.parse(localStorage.getItem('heli_cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('heli_cart', JSON.stringify(cart));
  updateBadges();
}

function addToCart(heli) {
  const cart = getCart();
  const exists = cart.find(i => i.id === heli.id);
  if (exists) {
    showToast(`${heli.marca} ${heli.modelo} ya está en el carrito`, 'info');
    return;
  }
  cart.push(heli);
  saveCart(cart);
  showToast(`${heli.marca} ${heli.modelo} agregado al carrito 🛒`, 'success');
}

function removeFromCart(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

// ─── LocalStorage: Favoritos ──────────────────────────────────
function getFavorites() {
  return JSON.parse(localStorage.getItem('heli_favorites') || '[]');
}

function saveFavorites(favs) {
  localStorage.setItem('heli_favorites', JSON.stringify(favs));
  updateBadges();
}

function addToFavorites(heli) {
  const favs = getFavorites();
  const exists = favs.find(i => i.id === heli.id);
  if (exists) {
    showToast(`${heli.marca} ${heli.modelo} ya está en favoritos`, 'info');
    return;
  }
  favs.push(heli);
  saveFavorites(favs);
  showToast(`${heli.marca} ${heli.modelo} guardado en favoritos `, 'success');
}

function removeFromFavorites(id) {
  const favs = getFavorites().filter(i => i.id !== id);
  saveFavorites(favs);
}

// ─── Fetch helpers ────────────────────────────────────────────
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Iniciar navbar en todas las páginas ─────────────────────
document.addEventListener('DOMContentLoaded', initNavbar);