// Global variables
let cartData = {};
let itemCount = 0;
let currentItem = null;
let slideIndex = 0;

// DOM elements holder
const elements = {
  loginModal: null,
  foodModal: null,
  orderConfirmModal: null,
  overlay: null,
  cartSidebar: null,
  profileSidebar: null,
  cartItems: null,
  totalPrice: null,
  itemCountElement: null,
  profileContent: null
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  initializeEventListeners();
  initializeSlideshow();
  updateCartText();
  checkUserAuth();
});

// Initialize DOM elements and overlay click for closing modals/sidebars
function initializeElements() {
  elements.loginModal = document.getElementById('loginModal');
  elements.foodModal = document.getElementById('foodModal');
  elements.orderConfirmModal = document.getElementById('orderConfirmModal');
  elements.overlay = document.getElementById('modalOverlay');
  elements.cartSidebar = document.getElementById('cartSidebar');
  elements.profileSidebar = document.getElementById('profileSidebar');
  elements.cartItems = document.getElementById('cartItems');
  elements.totalPrice = document.getElementById('totalPrice');
  elements.itemCountElement = document.getElementById('itemCount');
  elements.profileContent = document.getElementById('profileContent');

  if (elements.overlay) {
    elements.overlay.addEventListener('click', () => {
      closeAllModalsAndSidebars();
    });
  }
}

// Initialize all event listeners modularly
function initializeEventListeners() {
  initializeNavigation();
  initializeMenuCards();
  initializeAuth();
  initializeCart();
  initializeProfile();
  initializeModals();
  initializeFoodModal();
}

// Smooth scrolling nav buttons
function initializeNavigation() {
  document.querySelectorAll('.nav-link, .hero-content .btn').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const targetId = el.getAttribute('href');
      const target = document.querySelector(targetId);
      if (!target) return;
      const headerHeight = document.querySelector('.header').offsetHeight;
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// Initialize menu cards click and add to cart buttons
function initializeMenuCards() {
  document.querySelectorAll('.menu-card').forEach((card, index) => {
    card.setAttribute('data-id', `item${index + 1}`);

    // Clicking card opens food modal (except on add button)
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn')) {
        e.stopPropagation();
        return;
      }
      openFoodModal(extractCardData(card));
    });

    // Add to cart button inside card
    const addBtn = card.querySelector('.btn');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = extractCardData(card);
        addToCart({ id: item.id, name: item.name, price: item.price, quantity: 1 });
        showNotification('Товар добавлен в корзину!');
      });
    }
  });
}

// Extract data from menu card element
function extractCardData(card) {
  return {
    id: card.getAttribute('data-id'),
    name: card.querySelector('.card-title').textContent,
    description: card.querySelector('.card-description').textContent,
    price: parseInt(card.querySelector('.price').textContent.replace(/\D/g, '')),
    image: card.querySelector('img').src
  };
}

// Auth initialization: buttons and forms
function initializeAuth() {
  const loginBtn = document.getElementById('loginButton');
  const loginForm = document.getElementById('loginFormElement');
  const registrationForm = document.getElementById('registrationFormElement');
  const showLoginFormLink = document.getElementById('showLoginForm');
  const showRegistrationFormLink = document.getElementById('showRegistrationForm');

  if (loginBtn) loginBtn.addEventListener('click', () => openModal(elements.loginModal));
  if (showLoginFormLink) showLoginFormLink.addEventListener('click', e => {
    e.preventDefault();
    toggleAuthForms('login');
  });
  if (showRegistrationFormLink) showRegistrationFormLink.addEventListener('click', e => {
    e.preventDefault();
    toggleAuthForms('register');
  });
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (registrationForm) registrationForm.addEventListener('submit', handleRegistration);
}

// Toggle between login and registration forms
function toggleAuthForms(form) {
  const loginForm = document.getElementById('loginForm');
  const registrationForm = document.getElementById('registrationForm');
  if (!loginForm || !registrationForm) return;
  if (form === 'login') {
    registrationForm.style.display = 'none';
    loginForm.style.display = 'block';
  } else {
    loginForm.style.display = 'none';
    registrationForm.style.display = 'block';
  }
}

// Handle login with server
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showNotification('Пожалуйста, заполните все поля', 'error');
    return;
  }

  try {
    const res = await fetch('https://fastfoodmaniya-github-io.onrender.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);
      showNotification('Вход выполнен!');
      closeModal(elements.loginModal);
      updateLoginButtonToProfile();
    } else {
      showNotification(`Ошибка входа: ${data.message}`, 'error');
    }
  } catch (err) {
    console.error('Login error:', err);
    showNotification('Ошибка сети при попытке входа', 'error');
  }
}

// Handle registration with server
async function handleRegistration(e) {
  e.preventDefault();

  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  if (!username || !email || !password) {
    showNotification('Пожалуйста, заполните все поля', 'error');
    return;
  }

  try {
    const res = await fetch('https://fastfoodmaniya-github-io.onrender.com/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      showNotification('Регистрация успешна! Войдите в аккаунт.');
      toggleAuthForms('login');
      document.getElementById('loginEmail').value = email;
    } else {
      showNotification(`Ошибка регистрации: ${data.message}`, 'error');
    }
  } catch (err) {
    console.error('Registration error:', err);
    showNotification('Ошибка сети при регистрации', 'error');
  }
}

// Update login button to profile view
function updateLoginButtonToProfile() {
  const btn = document.getElementById('loginButton');
  if (!btn) return;
  const username = localStorage.getItem('username') || 'Профиль';

  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
    ${username}
  `;
  btn.id = 'profileButton';

  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener('click', e => {
    e.preventDefault();
    openSidebar(elements.profileSidebar);
    loadProfile();
  });
}

// Check auth on load
function checkUserAuth() {
  if (localStorage.getItem('accessToken')) {
    updateLoginButtonToProfile();
  }
}

// Cart system initialization
function initializeCart() {
  const cartBtn = document.getElementById('cartButton');
  const checkoutBtn = document.getElementById('checkoutButton');

  if (cartBtn) cartBtn.addEventListener('click', () => openSidebar(elements.cartSidebar));
  if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);
}

// Add item to cart
function addToCart(item) {
  if (cartData[item.id]) {
    cartData[item.id].quantity += item.quantity;
  } else {
    cartData[item.id] = { ...item };
  }
  updateCartCount();
  updateCartUI();
}

// Update cart UI
function updateCartUI() {
  const container = elements.cartItems;
  const emptyMessage = document.getElementById('cartEmptyMessage');
  if (!container) return;

  container.innerHTML = '';
  let total = 0;

  if (Object.keys(cartData).length === 0) {
    if (emptyMessage) emptyMessage.style.display = 'block';
    if (elements.totalPrice) elements.totalPrice.textContent = 'Всего: 0 ₽';
    return;
  }
  if (emptyMessage) emptyMessage.style.display = 'none';

  for (const id in cartData) {
    const item = cartData[id];
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <div class="cart-item-price">${itemTotal} ₽</div>
        <div class="cart-item-controls">
          <button class="quantity-btn" onclick="updateItemQuantity('${id}', false)">-</button>
          <input type="number" value="${item.quantity}" min="1" readonly>
          <button class="quantity-btn" onclick="updateItemQuantity('${id}', true)">+</button>
        </div>
      </div>
      <span class="remove-item" onclick="removeFromCart('${id}')">&times;</span>
    `;
    container.appendChild(div);
  }

  if (elements.totalPrice) {
    elements.totalPrice.textContent = `Всего: ${total} ₽`;
  }
}

// Update cart count and text
function updateCartCount() {
  itemCount = Object.values(cartData).reduce((sum, i) => sum + i.quantity, 0);
  if (elements.itemCountElement) {
    elements.itemCountElement.textContent = itemCount;
  }
}

// Update item quantity in cart
function updateItemQuantity(itemId, increase) {
  if (!cartData[itemId]) return;
  if (increase) {
    cartData[itemId].quantity++;
  } else {
    cartData[itemId].quantity--;
    if (cartData[itemId].quantity <= 0) {
      delete cartData[itemId];
    }
  }
  updateCartCount();
  updateCartUI();
}

// Remove item from cart
function removeFromCart(itemId) {
  if (!cartData[itemId]) return;
  delete cartData[itemId];
  updateCartCount();
  updateCartUI();
}

// Clear cart
function clearCart() {
  cartData = {};
  updateCartCount();
  updateCartUI();
}

// Handle checkout: open order form if logged in
function handleCheckout() {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    closeSidebar(elements.cartSidebar);
    openModal(elements.loginModal);
    return;
  }
  if (Object.keys(cartData).length === 0) {
    showNotification('Корзина пуста!', 'warning');
    return;
  }
  showOrderForm();
}

// Show order form modal with cart summary
function showOrderForm() {
  const orderItems = Object.values(cartData).map(item => 
    `${item.name} × ${item.quantity} — ${item.price * item.quantity} ₽`
  ).join('<br>');

  const total = Object.values(cartData).reduce((sum, item) => sum + item.price * item.quantity, 0);

  const orderSummary = document.getElementById('orderSummary');
  if (orderSummary) {
    orderSummary.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h4>Ваш заказ:</h4>
        ${orderItems}
        <hr style="margin: 10px 0;">
        <strong>Итого: ${total} ₽</strong>
      </div>
    `;
  }

  closeSidebar(elements.cartSidebar);
  openModal(elements.orderConfirmModal);
}

// Profile system initialization
function initializeProfile() {
  const profileOverlay = document.getElementById('profileOverlay');
  const logoutBtn = document.getElementById('logoutButton');
  document.querySelectorAll('#profileSidebar .sidebar-close').forEach(btn => {
    btn.addEventListener('click', () => closeSidebar(elements.profileSidebar));
  });
  if (profileOverlay) profileOverlay.addEventListener('click', () => closeSidebar(elements.profileSidebar));
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const finalOrderForm = document.getElementById('finalOrderForm');
  if (finalOrderForm) finalOrderForm.addEventListener('submit', handleOrderSubmission);
}

// Load user profile and orders from server
async function loadProfile() {
  const token = localStorage.getItem('accessToken');
  if (!token) return;
  const profileContent = elements.profileContent;
  profileContent.innerHTML = 'Загрузка...';

  try {
    const res = await fetch('https://fastfoodmaniya-github-io.onrender.com/api/user', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Ошибка загрузки профиля');
    const user = await res.json();

    profileContent.innerHTML = `
      <h3>Добро пожаловать, ${user.username}!</h3>
      <p>Email: ${user.email}</p>
      <h4>История заказов:</h4>
      <div id="ordersList">Загрузка заказов...</div>
    `;

    await loadOrders();

  } catch (err) {
    console.error(err);
    profileContent.innerHTML = '<p>Ошибка загрузки профиля</p>';
  }
}

// Load orders from server
async function loadOrders() {
  const token = localStorage.getItem('accessToken');
  if (!token) return;

  const ordersList = document.getElementById('ordersList');
  if (!ordersList) return;

  try {
    const res = await fetch('https://fastfoodmaniya-github-io.onrender.com/api/orders', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Ошибка загрузки заказов');
    const orders = await res.json();

    if (orders.length === 0) {
      ordersList.innerHTML = '<p>Заказов пока нет.</p>';
      return;
    }

    ordersList.innerHTML = orders.map((order, i) => {
      const date = new Date(order.createdAt).toLocaleString();
      const itemsList = order.items.map(item => `<li>${item.name} × ${item.quantity} (${item.price * item.quantity} ₽)</li>`).join('');
      return `
        <div class="order-item" style="border:1px solid #ddd; padding:10px; margin-bottom:10px;">
          <p><strong>Дата:</strong> ${date}</p>
          <ul>${itemsList}</ul>
          <p><strong>Итого:</strong> ${order.total} ₽</p>
          <button class="repeat-order-btn" onclick="repeatOrder(${i})">Повторить заказ</button>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
    ordersList.innerHTML = '<p>Не удалось загрузить заказы.</p>';
  }
}

// Repeat order - добавляем товары из заказа в корзину
function repeatOrder(index) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    showNotification('Пожалуйста, войдите в аккаунт для повтора заказа', 'error');
    openModal(elements.loginModal);
    return;
  }

  loadOrdersFromStorageAndRepeat(index);
}

async function loadOrdersFromStorageAndRepeat(index) {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const res = await fetch('https://fastfoodmaniya-github-io.onrender.com/api/orders', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Ошибка загрузки заказов');
    const orders = await res.json();

    if (!orders[index]) {
      showNotification('Заказ не найден', 'error');
      return;
    }

    orders[index].items.forEach(item => {
      addToCart({
        id: item.id || `repeat_${Date.now()}`, // fallback id
        name: item.name,
        price: item.price,
        quantity: item.quantity
      });
    });

    showNotification('Заказ добавлен в корзину');
    openSidebar(elements.cartSidebar);
  } catch (err) {
    console.error(err);
    showNotification('Ошибка при повтое заказа', 'error');
  }
}

// Logout
async function handleLogout() {
  const token = localStorage.getItem('accessToken');
  try {
    await fetch('https://fastfoodmaniya-github-io.onrender.com/logout', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
  } catch (err) {
    console.error('Logout error:', err);
  }

  localStorage.clear();
  clearCart();
  closeSidebar(elements.profileSidebar);

  // Возврат кнопки профиля в кнопку входа
  const btn = document.getElementById('profileButton');
  if (!btn) return;
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
    Войти
  `;
  btn.id = 'loginButton';

  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener('click', () => openModal(elements.loginModal));
}

// Order form submission
async function handleOrderSubmission(e) {
  e.preventDefault();

  const token = localStorage.getItem('accessToken');
  if (!token) {
    showNotification('Пожалуйста, войдите в аккаунт', 'error');
    openModal(elements.loginModal);
    return;
  }

  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();

  if (!phone || !address) {
    showNotification('Пожалуйста, заполните телефон и адрес', 'error');
    return;
  }

  const items = Object.values(cartData).map(({ id, name, price, quantity }) => ({ id, name, price, quantity }));
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  try {
    const res = await fetch('https://fastfoodmaniya-github-io.onrender.com/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ items, total, phone, address })
    });

    if (res.ok) {
      showNotification('Заказ успешно оформлен!');
      clearCart();
      closeModal(elements.orderConfirmModal);
    } else {
      const data = await res.json();
      showNotification(`Ошибка при оформлении заказа: ${data.message}`, 'error');
    }
  } catch (err) {
    console.error('Order submission error:', err);
    showNotification('Ошибка сети при оформлении заказа', 'error');
  }
}

// Modal system: close buttons and overlay
function initializeModals() {
  // Close modals by X buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', e => {
      const modal = e.target.closest('.modal');
      closeModal(modal);
    });
  });

  // Close sidebars by close buttons
  document.querySelectorAll('.sidebar-close').forEach(btn => {
    btn.addEventListener('click', e => {
      const sidebar = e.target.closest('.sidebar');
      closeSidebar(sidebar);
    });
  });
}

// Open modal
function openModal(modal) {
  if (modal && elements.overlay) {
    modal.style.display = 'block';
    elements.overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

// Close modal
function closeModal(modal) {
  if (modal && elements.overlay) {
    modal.style.display = 'none';
    elements.overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Close all modals and sidebars
function closeAllModalsAndSidebars() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
  document.querySelectorAll('.sidebar').forEach(sidebar => {
    sidebar.classList.remove('open');
  });
  if (elements.overlay) {
    elements.overlay.style.display = 'none';
  }
  document.body.style.overflow = '';
}

// Open sidebar (no overlay dim for profile sidebar as requested)
function openSidebar(sidebar) {
  if (!sidebar) return;
  sidebar.classList.add('open');
  if (sidebar === elements.profileSidebar) {
    // no overlay dim for profile sidebar per request
  } else {
    if (elements.overlay) elements.overlay.style.display = 'block';
  }
  document.body.style.overflow = 'hidden';
}

// Close sidebar
function closeSidebar(sidebar) {
  if (!sidebar) return;
  sidebar.classList.remove('open');
  if (sidebar === elements.profileSidebar) {
    // no overlay dim for profile sidebar
  } else {
    if (elements.overlay) elements.overlay.style.display = 'none';
  }
  document.body.style.overflow = '';
}

// Food modal controls
function initializeFoodModal() {
  const addToCartBtn = document.getElementById('addToCart');
  const decreaseBtn = document.getElementById('decreaseQuantity');
  const increaseBtn = document.getElementById('increaseQuantity');
  const quantityInput = document.getElementById('foodQuantity');

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      if (currentItem) {
        const qty = parseInt(quantityInput.value);
        addToCart({ id: currentItem.id, name: currentItem.name, price: currentItem.price, quantity: qty });
        showNotification('Товар добавлен в корзину!');
        closeModal(elements.foodModal);
      }
    });
  }
  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', () => {
      const val = parseInt(quantityInput.value);
      if (val > 1) quantityInput.value = val - 1;
    });
  }
  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => {
      const val = parseInt(quantityInput.value);
      quantityInput.value = val + 1;
    });
  }
}

// Open food modal and fill data
function openFoodModal(data) {
  currentItem = data;
  const modalName = document.getElementById('modalName');
  const modalImage = document.getElementById('modalImage');
  const modalPrice = document.getElementById('modalPrice');
  const modalDescription = document.getElementById('modalDescription');
  const foodCalories = document.getElementById('foodCalories');
  const foodQuantity = document.getElementById('foodQuantity');

  if (modalName) modalName.textContent = data.name;
  if (modalImage) modalImage.src = data.image;
  if (modalPrice) modalPrice.textContent = data.price + ' ₽';
  if (modalDescription) modalDescription.textContent = data.description;
  if (foodCalories) foodCalories.textContent = 'Калории: 500 ккал';
  if (foodQuantity) foodQuantity.value = 1;

  openModal(elements.foodModal);
}

// Slideshow (hero slider)
function initializeSlideshow() {
  const slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;

  setInterval(() => {
    slides[slideIndex].classList.remove('active');
    slideIndex = (slideIndex + 1) % slides.length;
    slides[slideIndex].classList.add('active');
  }, 4000);
}

// Notification system (toast-like)
function showNotification(message, type = 'success') {
  const notif = document.createElement('div');
  notif.className = `notification notification-${type}`;
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

// Make some functions global for inline onclick handlers
window.updateItemQuantity = updateItemQuantity;
window.removeFromCart = removeFromCart;
window.repeatOrder = repeatOrder;
