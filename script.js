// Global variables
let cartData = {};
let itemCount = 0;

// DOM elements
const elements = {
  loginModal: null,
  orderConfirmModal: null,
  overlay: null,
  cartSidebar: null,
  profileSidebar: null,
  cartItems: null,
  totalPrice: null,
  itemCountElement: null,
  profileContent: null
};

document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  initializeEventListeners();
  checkUserAuth();
  updateCartUI();
});

function initializeElements() {
  elements.loginModal = document.getElementById('loginModal');
  elements.orderConfirmModal = document.getElementById('orderConfirmModal');
  elements.overlay = document.getElementById('modalOverlay');
  elements.cartSidebar = document.getElementById('cartSidebar');
  elements.profileSidebar = document.getElementById('profileSidebar');
  elements.cartItems = document.getElementById('cartItems');
  elements.totalPrice = document.getElementById('totalPrice');
  elements.itemCountElement = document.getElementById('itemCount');
  elements.profileContent = document.getElementById('profileContent');

  // Закрытие всех окон по клику на оверлей
  elements.overlay.addEventListener('click', () => {
    closeModal(elements.loginModal);
    closeModal(elements.orderConfirmModal);
    closeSidebar(elements.cartSidebar);
    closeSidebar(elements.profileSidebar);
    elements.overlay.style.display = 'none';
  });
}

function initializeEventListeners() {
  document.getElementById('loginButton').addEventListener('click', () => openModal(elements.loginModal));
  document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
  document.getElementById('registrationFormElement').addEventListener('submit', handleRegistration);
  document.getElementById('logoutButton').addEventListener('click', handleLogout);
  document.getElementById('checkoutButton').addEventListener('click', handleCheckout);
  document.getElementById('finalOrderForm').addEventListener('submit', handleOrderSubmission);

  document.getElementById('showLoginForm').addEventListener('click', e => {
    e.preventDefault();
    toggleAuthForms('login');
  });
  document.getElementById('showRegistrationForm').addEventListener('click', e => {
    e.preventDefault();
    toggleAuthForms('register');
  });
}

function toggleAuthForms(form) {
  if (form === 'login') {
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
  } else {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registrationForm').style.display = 'block';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    alert('Пожалуйста, заполните все поля');
    return;
  }

  try {
    const response = await fetch('https://fastfoodmaniya-github-io.onrender.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);

      alert('Вход выполнен!');
      closeModal(elements.loginModal);
      updateLoginButtonToProfile();
    } else {
      alert('Ошибка входа: ' + data.message);
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Ошибка сети при попытке входа');
  }
}

async function handleRegistration(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  if (!username || !email || !password) {
    alert('Пожалуйста, заполните все поля');
    return;
  }

  try {
    const response = await fetch('https://fastfoodmaniya-github-io.onrender.com/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Регистрация успешна! Теперь войдите в аккаунт.');
      toggleAuthForms('login');
      document.getElementById('loginEmail').value = email;
    } else {
      alert('Ошибка регистрации: ' + data.message);
    }
  } catch (err) {
    console.error('Registration error:', err);
    alert('Ошибка сети при регистрации');
  }
}

function updateLoginButtonToProfile() {
  const loginButton = document.getElementById('loginButton');
  const username = localStorage.getItem('username') || 'Профиль';

  loginButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
    ${username}
  `;

  loginButton.id = 'profileButton';

  loginButton.onclick = () => {
    openSidebar(elements.profileSidebar);
    loadProfile();
  };
}

function checkUserAuth() {
  const token = localStorage.getItem('accessToken');
  if (token) {
    updateLoginButtonToProfile();
  }
}

async function loadProfile() {
  const token = localStorage.getItem('accessToken');
  if (!token) return;

  const profileContent = elements.profileContent;
  profileContent.innerHTML = 'Загрузка...';

  try {
    const response = await fetch('https://fastfoodmaniya-github-io.onrender.com/api/user', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!response.ok) throw new Error('Не удалось загрузить профиль');

    const user = await response.json();

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

async function loadOrders() {
  const token = localStorage.getItem('accessToken');
  if (!token) return;

  const ordersList = document.getElementById('ordersList');
  if (!ordersList) return;

  try {
    const response = await fetch('https://fastfoodmaniya-github-io.onrender.com/api/orders', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!response.ok) throw new Error('Ошибка при получении заказов');

    const orders = await response.json();

    if (orders.length === 0) {
      ordersList.innerHTML = '<p>Заказов пока нет.</p>';
      return;
    }

    ordersList.innerHTML = orders.map(order => {
      const date = new Date(order.createdAt).toLocaleString();
      const itemsList = order.items.map(i => `<li>${i.name} × ${i.quantity} (${i.price * i.quantity} ₽)</li>`).join('');
      return `
        <div class="order-item" style="border:1px solid #ddd; padding:10px; margin-bottom:10px;">
          <p><strong>Дата:</strong> ${date}</p>
          <ul>${itemsList}</ul>
          <p><strong>Итого:</strong> ${order.total} ₽</p>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
    ordersList.innerHTML = '<p>Не удалось загрузить заказы.</p>';
  }
}

function handleLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');

  alert('Вы вышли из аккаунта');
  location.reload();
}

// Cart management
function addToCart(item) {
  if (cartData[item.id]) {
    cartData[item.id].quantity += item.quantity;
  } else {
    cartData[item.id] = { ...item };
  }
  updateCartUI();
}

function updateCartUI() {
  const container = elements.cartItems;
  if (!container) return;

  container.innerHTML = '';
  let total = 0;
  let count = 0;

  for (const id in cartData) {
    const item = cartData[id];
    total += item.price * item.quantity;
    count += item.quantity;

    container.innerHTML += `
      <div class="cart-item">
        <h4>${item.name}</h4>
        <p>Количество: ${item.quantity}</p>
        <p>Цена: ${item.price * item.quantity} ₽</p>
      </div>
    `;
  }

  elements.totalPrice.textContent = `Всего: ${total} ₽`;
  elements.itemCountElement.textContent = count;
}

function clearCart() {
  cartData = {};
  updateCartUI();
}

function handleCheckout() {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    alert('Пожалуйста, войдите в аккаунт для оформления заказа');
    openModal(elements.loginModal);
    return;
  }

  if (Object.keys(cartData).length === 0) {
    alert('Корзина пуста');
    return;
  }

  openModal(elements.orderConfirmModal);
}

async function handleOrderSubmission(e) {
  e.preventDefault();

  const token = localStorage.getItem('accessToken');
  if (!token) {
    alert('Ошибка авторизации');
    return;
  }

  const phone = document.getElementById('orderPhone').value.trim();
  const address = document.getElementById('orderAddress').value.trim();

  if (!phone || !address) {
    alert('Пожалуйста, заполните телефон и адрес');
    return;
  }

  const items = Object.values(cartData).map(({ id, name, price, quantity }) => ({ id, name, price, quantity }));
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  try {
    const response = await fetch('https://fastfoodmaniya-github-io.onrender.com/api/orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ items, total, phone, address })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Заказ успешно оформлен!');
      clearCart();
      closeModal(elements.orderConfirmModal);
      closeSidebar(elements.cartSidebar);
      await loadOrders(); // обновляем историю заказов
    } else {
      alert('Ошибка при оформлении заказа: ' + data.message);
    }
  } catch (err) {
    console.error('Order submission error:', err);
    alert('Ошибка сети при оформлении заказа');
  }
}

// UI utility functions
function openModal(modal) {
  if (!modal) return;
  modal.style.display = 'block';
  elements.overlay.style.display = 'block';
}

function closeModal(modal) {
  if (!modal) return;
  modal.style.display = 'none';
  // Скрываем overlay, только если нет открытых модалок
  if (
    (!elements.loginModal || elements.loginModal.style.display === 'none') &&
    (!elements.orderConfirmModal || elements.orderConfirmModal.style.display === 'none')
  ) {
    elements.overlay.style.display = 'none';
  }
}

function openSidebar(sidebar) {
  if (!sidebar) return;
  sidebar.classList.add('open');
  // При открытии сайдбара overlay НЕ показываем (чтобы не блокировал клики)
}

function closeSidebar(sidebar) {
  if (!sidebar) return;
  sidebar.classList.remove('open');
}
