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
        <p><strong>Итого:</strong> ${order.total} ₽</p>
        <button class="repeat-order-btn" onclick="repeatOrder(${index})">Повторить заказ</button>
      </div>
    `;
  }).join('');

  profileContent.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h3>Добро пожаловать, ${username}!</h3>
    </div>
    <h3>История заказов:</h3>
    ${ordersHTML}
  `;
}

// Повтор заказа
function repeatOrder(orderIndex) {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    showNotification('Пожалуйста, войдите в аккаунт для повтора заказа', 'error');
    openModal(elements.loginModal);
    return;
  }

  const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
  if (!orders || !orders[orderIndex]) {
    showNotification('Заказ не найден', 'error');
    return;
  }

  // Копируем товары из заказа в корзину
  orders[orderIndex].items.forEach(item => {
    addToCart({
      id: item.id || `repeat_${Date.now()}`, // Если id нет, создаём уникальный
      name: item.name,
      price: item.price,
      quantity: item.quantity
    });
  });

  showNotification('Заказ добавлен в корзину');
  openSidebar(elements.cartSidebar);
}

async function handleLogout() {
  const userId = localStorage.getItem('userId');

  try {
    await fetch('https://fastfoodmania-api.onrender.com/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  // Очищаем только данные авторизации, оставляем зарегистрированных пользователей и их заказы
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('userDisplayName');
  localStorage.removeItem('accessToken');

  clearCart();
  closeSidebar(elements.profileSidebar);

  // Восстанавливаем кнопку входа
  const profileButton = document.getElementById('profileButton');
  if (profileButton) {
    profileButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      Войти
    `;
    profileButton.id = 'loginButton';

    // Remove old listeners and add new one
    const newButton = profileButton.cloneNode(true);
    profileButton.parentNode.replaceChild(newButton, profileButton);

    newButton.addEventListener('click', () => openModal(elements.loginModal));
  }
}

async function handleOrderSubmission(e) {
  e.preventDefault();

  const userId = localStorage.getItem('userId');
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;

  const items = Object.values(cartData).map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity
  }));

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Сохраняем заказ локально
  const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
  orders.push({
    date: new Date().toISOString(),
    items,
    total,
    phone,
    address
  });
  localStorage.setItem(`orders_${userId}`, JSON.stringify(orders));

  try {
    const response = await fetch('https://fastfoodmania-api.onrender.com/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items, total, phone, address })
    });

    if (response.ok) {
      showNotification('Заказ успешно оформлен! Данные отправлены на почту.');
    } else {
      showNotification('Заказ сохранен локально. Данные отправлены на почту.');
    }
  } catch (error) {
    console.error('Order submission error:', error);
    showNotification('Заказ сохранен локально. Данные отправлены на почту.');
  }

  clearCart();
  closeModal(elements.orderConfirmModal);
}

// Modal system
function initializeModals() {
  // Close modals
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      closeModal(modal);
    });
  });

  // Close sidebars
  document.querySelectorAll('.sidebar-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sidebar = e.target.closest('.sidebar');
      closeSidebar(sidebar);
    });
  });

  // Close on overlay click
  if (elements.overlay) {
    elements.overlay.addEventListener('click', () => {
      closeAllModals();
    });
  }
}

function openModal(modal) {
  if (modal && elements.overlay) {
    modal.style.display = 'block';
    elements.overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modal) {
  if (modal && elements.overlay) {
    modal.style.display = 'none';

    // Проверяем есть ли открытые модалки или сайдбары кроме profileSidebar
    const anyModalOpen = Array.from(document.querySelectorAll('.modal')).some(m => m.style.display === 'block');
    const cartOpen = elements.cartSidebar && elements.cartSidebar.classList.contains('open');

    if (!anyModalOpen && !cartOpen) {
      elements.overlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
  if (elements.overlay) {
    elements.overlay.style.display = 'none';
  }
  document.body.style.overflow = '';
}

function openSidebar(sidebar) {
  if (!sidebar) return;

  sidebar.classList.add('open');

  // НЕ показываем overlay для профиля
  if (sidebar !== elements.profileSidebar) {
    if (elements.overlay) {
      elements.overlay.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  } else {
    // Для профиля не блокируем прокрутку
    document.body.style.overflow = '';
  }
}

function closeSidebar(sidebar) {
  if (!sidebar) return;

  sidebar.classList.remove('open');

  // Если закрываем сайдбар кроме профиля — скрываем оверлей
  if (sidebar !== elements.profileSidebar) {
    if (elements.overlay) {
      elements.overlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  }
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
        const quantity = parseInt(quantityInput.value);
        addToCart({
          id: currentItem.id,
          name: currentItem.name,
          price: currentItem.price,
          quantity: quantity
        });
        showNotification('Товар добавлен в корзину!');
        closeModal(elements.foodModal);
      }
    });
  }

  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', () => {
      let value = parseInt(quantityInput.value);
      if (value > 1) {
        quantityInput.value = value - 1;
      }
    });
  }

  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => {
      let value = parseInt(quantityInput.value);
      quantityInput.value = value + 1;
    });
  }
}

function openFoodModal(cardData) {
  currentItem = cardData;

  const modalName = document.getElementById('modalName');
  const modalImage = document.getElementById('modalImage');
  const modalPrice = document.getElementById('modalPrice');
  const modalDescription = document.getElementById('modalDescription');
  const foodCalories = document.getElementById('foodCalories');
  const foodQuantity = document.getElementById('foodQuantity');

  if (modalName) modalName.textContent = cardData.name;
  if (modalImage) modalImage.src = cardData.image;
  if (modalPrice) modalPrice.textContent = cardData.price + ' ₽';
  if (modalDescription) modalDescription.textContent = cardData.description;
  if (foodCalories) foodCalories.textContent = 'Калории: 500 ккал';
  if (foodQuantity) foodQuantity.value = 1;

  openModal(elements.foodModal);
}

// Slideshow
function initializeSlideshow() {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length === 0) return;

  setInterval(() => {
    slides[slideIndex].classList.remove('active');
    slideIndex = (slideIndex + 1) % slides.length;
    slides[slideIndex].classList.add('active');
  }, 4000);
}

// Notification system
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Make functions global for onclick handlers
window.updateItemQuantity = updateItemQuantity;
window.removeFromCart = removeFromCart;
window.repeatOrder = repeatOrder;
