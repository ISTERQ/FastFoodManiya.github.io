// Global variables
let cartData = {};
let itemCount = 0;
let currentItem = null;
let slideIndex = 0;

// DOM elements
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

// Initialize DOM elements
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

  // Оверлей закрывает все модалки и сайдбары
  elements.overlay.addEventListener('click', () => {
    closeModal(elements.loginModal);
    closeModal(elements.foodModal);
    closeModal(elements.orderConfirmModal);
    closeSidebar(elements.cartSidebar);
    closeSidebar(elements.profileSidebar);
  });
}

// Initialize event listeners
function initializeEventListeners() {
  initializeNavigation();
  initializeMenuCards();
  initializeAuth();
  initializeCart();
  initializeProfile();
  initializeModals();
  initializeFoodModal();
}

// Smooth navigation
function initializeNavigation() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Hero buttons
  document.querySelectorAll('.hero-content .btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// Menu cards
function initializeMenuCards() {
  document.querySelectorAll('.menu-card').forEach((card, index) => {
    card.setAttribute('data-id', `item${index + 1}`);

    // Обработчик клика по карточке
    card.addEventListener('click', (e) => {
      // Проверяем, что клик не был по кнопке "В корзину"
      if (e.target.classList.contains('btn')) {
        e.stopPropagation();
        return;
      }

      const cardData = extractCardData(card);
      openFoodModal(cardData);
    });

    // Обработчик для кнопки "В корзину"
    const addButton = card.querySelector('.btn');
    if (addButton) {
      addButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const cardData = extractCardData(card);
        addToCart({
          id: cardData.id,
          name: cardData.name,
          price: cardData.price,
          quantity: 1
        });
        showNotification('Товар добавлен в корзину!');
      });
    }
  });
}

function extractCardData(card) {
  const id = card.getAttribute('data-id');
  const name = card.querySelector('.card-title').textContent;
  const description = card.querySelector('.card-description').textContent;
  const priceText = card.querySelector('.price').textContent;
  const price = parseInt(priceText.replace(/\D/g, ''));
  const image = card.querySelector('img').src;

  return { id, name, description, price, image };
}

// Auth system
function initializeAuth() {
  const loginButton = document.getElementById('loginButton');
  const loginForm = document.getElementById('loginFormElement');
  const registrationForm = document.getElementById('registrationFormElement');
  const showLoginForm = document.getElementById('showLoginForm');
  const showRegistrationForm = document.getElementById('showRegistrationForm');

  if (loginButton) {
    loginButton.addEventListener('click', () => openModal(elements.loginModal));
  }

  if (showLoginForm) {
    showLoginForm.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('registrationForm').style.display = 'none';
      document.getElementById('loginForm').style.display = 'block';
    });
  }

  if (showRegistrationForm) {
    showRegistrationForm.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('loginForm').style.display = 'none';
      document.getElementById('registrationForm').style.display = 'block';
    });
  }

  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  if (registrationForm) {
    registrationForm.addEventListener('submit', handleRegistration);
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch('https://fastfoodmania-api.onrender.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', email);

      showNotification('Вход выполнен!');
      closeModal(elements.loginModal);
      updateLoginButtonToProfile();
    } else {
      showNotification('Ошибка входа: ' + (data.message || 'Неверные данные'), 'error');
    }
  } catch (error) {
    console.error('Login error:', error);

    // Fallback to local user
    const savedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const user = savedUsers.find(u => u.email === email && u.password === password);

    if (user) {
      localStorage.setItem('accessToken', 'localToken');
      localStorage.setItem('userId', user.id);
      localStorage.setItem('username', user.email);
      localStorage.setItem('userDisplayName', user.username);

      showNotification('Вход выполнен в локальном режиме!');
      closeModal(elements.loginModal);
      updateLoginButtonToProfile();
    } else {
      showNotification('Неверный email или пароль', 'error');
    }
  }
}

async function handleRegistration(e) {
  e.preventDefault();

  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  try {
    const response = await fetch('https://fastfoodmania-api.onrender.com/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const result = await response.json();

    if (response.ok) {
      showNotification('Регистрация успешна! Теперь войдите в свой аккаунт.');

      document.getElementById('registrationForm').style.display = 'none';
      document.getElementById('loginForm').style.display = 'block';
      document.getElementById('loginEmail').value = email;
    } else {
      showNotification('Ошибка: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Registration error:', error);

    // Fallback to local storage
    const savedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

    // Проверяем, существует ли пользователь
    if (savedUsers.some(u => u.email === email)) {
      showNotification('Пользователь с таким email уже существует', 'error');
      return;
    }

    // Создаем нового пользователя
    const newUser = {
      id: 'user_' + Date.now(),
      username,
      email,
      password,
      createdAt: new Date().toISOString()
    };

    savedUsers.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(savedUsers));

    showNotification('Регистрация успешна! Теперь войдите в свой аккаунт.');

    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('loginEmail').value = email;
  }
}

function updateLoginButtonToProfile() {
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    const username = localStorage.getItem('userDisplayName') || localStorage.getItem('username') || 'Профиль';
    loginButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      ${username}
    `;
    loginButton.id = 'profileButton';

    // Remove old listeners and add new one
    const newButton = loginButton.cloneNode(true);
    loginButton.parentNode.replaceChild(newButton, loginButton);

    newButton.addEventListener('click', (e) => {
      e.preventDefault();
      openSidebar(elements.profileSidebar);
      loadProfile();
    });
  }
}

function checkUserAuth() {
  const userId = localStorage.getItem('userId');
  if (userId) {
    updateLoginButtonToProfile();
  }
}

// Cart system
function initializeCart() {
  const cartButton = document.getElementById('cartButton');
  const checkoutButton = document.getElementById('checkoutButton');

  if (cartButton) {
    cartButton.addEventListener('click', () => {
      openSidebar(elements.cartSidebar);
    });
  }

  if (checkoutButton) {
    checkoutButton.addEventListener('click', handleCheckout);
  }
}

function addToCart(item) {
  if (cartData[item.id]) {
    cartData[item.id].quantity += item.quantity;
  } else {
    cartData[item.id] = { ...item };
  }
  itemCount += item.quantity;
  updateCartText();
  updateCartUI();
}

function updateCartUI() {
  const cartItemsContainer = elements.cartItems;
  const cartEmptyMessage = document.getElementById('cartEmptyMessage');

  if (!cartItemsContainer) return;

  cartItemsContainer.innerHTML = '';
  let total = 0;

  if (Object.keys(cartData).length === 0) {
    if (cartEmptyMessage) cartEmptyMessage.style.display = 'block';
    if (elements.totalPrice) elements.totalPrice.textContent = 'Всего: 0 ₽';
    return;
  }

  if (cartEmptyMessage) cartEmptyMessage.style.display = 'none';

  for (const itemId in cartData) {
    const item = cartData[itemId];
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    itemElement.innerHTML = `
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <div class="cart-item-price">${itemTotal} ₽</div>
        <div class="cart-item-controls">
          <button class="quantity-btn" onclick="updateItemQuantity('${itemId}', false)">-</button>
          <input type="number" value="${item.quantity}" min="1" readonly>
          <button class="quantity-btn" onclick="updateItemQuantity('${itemId}', true)">+</button>
        </div>
      </div>
      <span class="remove-item" onclick="removeFromCart('${itemId}')">&times;</span>
    `;

    cartItemsContainer.appendChild(itemElement);
  }

  if (elements.totalPrice) {
    elements.totalPrice.textContent = `Всего: ${total} ₽`;
  }
}

function updateItemQuantity(itemId, increase) {
  if (cartData[itemId]) {
    if (increase) {
      cartData[itemId].quantity++;
      itemCount++;
    } else {
      cartData[itemId].quantity--;
      itemCount--;
      if (cartData[itemId].quantity <= 0) {
        delete cartData[itemId];
      }
    }
    updateCartText();
    updateCartUI();
  }
}

function removeFromCart(itemId) {
  if (cartData[itemId]) {
    itemCount -= cartData[itemId].quantity;
    delete cartData[itemId];
    updateCartText();
    updateCartUI();
  }
}

function updateCartText() {
  itemCount = Object.values(cartData).reduce((sum, item) => sum + item.quantity, 0);
  if (elements.itemCountElement) {
    elements.itemCountElement.textContent = itemCount;
  }
}

function clearCart() {
  cartData = {};
  itemCount = 0;
  updateCartText();
  updateCartUI();
}

function handleCheckout() {
  const userId = localStorage.getItem('userId');

  if (!userId) {
    closeSidebar(elements.cartSidebar);
    openModal(elements.loginModal);
    return;
  }

  if (Object.keys(cartData).length === 0) {
    showNotification('Корзина пуста!', 'warning');
    return;
  }

  // Показываем форму с телефоном и адресом
  showOrderForm();
}

function saveOrderToProfile() {
  const userId = localStorage.getItem('userId');
  const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');

  const items = Object.values(cartData).map(item => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price
  }));

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  orders.push({
    date: new Date().toISOString(),
    items,
    total
  });

  localStorage.setItem(`orders_${userId}`, JSON.stringify(orders));
}

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

// Profile system
function initializeProfile() {
  const profileOverlay = document.getElementById('profileOverlay');
  const logoutButton = document.getElementById('logoutButton');

  // Close profile sidebar
  document.querySelectorAll('#profileSidebar .sidebar-close').forEach(btn => {
    btn.addEventListener('click', () => {
      closeSidebar(elements.profileSidebar);
    });
  });

  if (profileOverlay) {
    profileOverlay.addEventListener('click', () => {
      closeSidebar(elements.profileSidebar);
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }

  // Order form submission
  const finalOrderForm = document.getElementById('finalOrderForm');
  if (finalOrderForm) {
    finalOrderForm.addEventListener('submit', handleOrderSubmission);
  }
}

async function loadProfile() {
  const userId = localStorage.getItem('userId');
  const profileContent = elements.profileContent;

  if (!profileContent || !userId) return;

  profileContent.innerHTML = '<p>Загрузка...</p>';

  // Загружаем заказы из localStorage
  const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
  displayOrders(orders);
}

function displayOrders(orders) {
  const profileContent = elements.profileContent;
  const username = localStorage.getItem('userDisplayName') || localStorage.getItem('username');

  if (orders.length === 0) {
    profileContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h3>Добро пожаловать, ${username}!</h3>
        <p>У вас пока нет заказов.</p>
      </div>
    `;
    return;
  }

  const ordersHTML = orders.map((order, index) => {
    const date = new Date(order.date || order.createdAt).toLocaleString();
    const itemsList = order.items.map(item =>
      `<li>${item.name} × ${item.quantity} (${item.price * item.quantity} ₽)</li>`
    ).join('');

    return `
      <div class="order-item" style="border:1px solid #ddd; padding:10px; margin-bottom:10px;">
        <p><strong>Дата:</strong> ${date}</p>
        <ul>${itemsList}</ul>
        <p><strong>Итого:</strong
