// Глобальные переменные
let cartData = {};
let itemCount = 0;
let currentItem = null;

// Элементы DOM
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

document.addEventListener('DOMContentLoaded', () => {
  initElements();
  initEventListeners();
  updateCartUI();
  checkUserAuth();
});

function initElements() {
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

function initEventListeners() {
  // Кнопка входа / профиль
  const loginBtn = document.getElementById('loginButton');
  if (loginBtn) loginBtn.addEventListener('click', () => openModal(elements.loginModal));

  // Форма логина
  const loginForm = document.getElementById('loginFormElement');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  // Форма регистрации
  const regForm = document.getElementById('registrationFormElement');
  if (regForm) regForm.addEventListener('submit', handleRegistration);

  // Кнопка закрытия модалок
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      closeModal(modal);
    });
  });

  // Кнопки закрытия сайдбаров
  document.querySelectorAll('.sidebar-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sidebar = e.target.closest('.sidebar');
      closeSidebar(sidebar);
    });
  });

  // Кнопка открытия корзины
  const cartBtn = document.getElementById('cartButton');
  if (cartBtn) cartBtn.addEventListener('click', () => openSidebar(elements.cartSidebar));

  // Кнопка оформления заказа
  const checkoutBtn = document.getElementById('checkoutButton');
  if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);

  // Кнопка выхода
  const logoutBtn = document.getElementById('logoutButton');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  // Кнопки карточек и добавления в корзину
  document.querySelectorAll('.menu-card').forEach(card => {
    // Открытие модалки по клику на карточку (исключая кнопки)
    card.addEventListener('click', (e) => {
      if (e.target.tagName.toLowerCase() === 'button') return; // кнопки обрабатываются отдельно
      const data = extractCardData(card);
      openFoodModal(data);
    });
    // Добавление в корзину с кнопки
    const btn = card.querySelector('button');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const data = extractCardData(card);
        addToCart({ id: data.id, name: data.name, price: data.price, quantity: 1 });
        showNotification('Добавлено в корзину');
      });
    }
  });

  // Управление количеством и добавление товара в модалке еды
  const addToCartBtn = document.getElementById('addToCart');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      if (!currentItem) return;
      const qtyInput = document.getElementById('foodQuantity');
      const qty = parseInt(qtyInput.value) || 1;
      addToCart({ id: currentItem.id, name: currentItem.name, price: currentItem.price, quantity: qty });
      showNotification('Добавлено в корзину');
      closeModal(elements.foodModal);
    });
  }

  document.getElementById('decreaseQuantity')?.addEventListener('click', () => {
    const qtyInput = document.getElementById('foodQuantity');
    let val = parseInt(qtyInput.value) || 1;
    if (val > 1) qtyInput.value = val - 1;
  });

  document.getElementById('increaseQuantity')?.addEventListener('click', () => {
    const qtyInput = document.getElementById('foodQuantity');
    let val = parseInt(qtyInput.value) || 1;
    qtyInput.value = val + 1;
  });

  // Отправка формы заказа
  const orderForm = document.getElementById('finalOrderForm');
  if (orderForm) orderForm.addEventListener('submit', handleOrderSubmission);
}

// Вспомогательная функция для извлечения данных карточки
function extractCardData(card) {
  return {
    id: card.getAttribute('data-id'),
    name: card.querySelector('.card-title').textContent,
    description: card.querySelector('.card-description').textContent,
    price: parseInt(card.querySelector('.price').textContent.replace(/\D/g, '')),
    image: card.querySelector('img').src
  };
}

// Открытие модалки еды
function openFoodModal(data) {
  currentItem = data;
  document.getElementById('modalName').textContent = data.name;
  document.getElementById('modalImage').src = data.image;
  document.getElementById('modalPrice').textContent = data.price + ' ₽';
  document.getElementById('modalDescription').textContent = data.description;
  document.getElementById('foodQuantity').value = 1;
  openModal(elements.foodModal);
}

// Добавление в корзину
function addToCart(item) {
  if (cartData[item.id]) {
    cartData[item.id].quantity += item.quantity;
  } else {
    cartData[item.id] = {...item};
  }
  updateCartUI();
  updateCartText();
}

// Обновление UI корзины
function updateCartUI() {
  const container = elements.cartItems;
  if (!container) return;

  container.innerHTML = '';
  let total = 0;
  let count = 0;

  for (const key in cartData) {
    const item = cartData[key];
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    count += item.quantity;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <h4>${item.name}</h4>
      <p>Количество: ${item.quantity}</p>
      <p>Цена: ${itemTotal} ₽</p>
      <button onclick="removeFromCart('${key}')">Удалить</button>
    `;
    container.appendChild(div);
  }
  elements.totalPrice.textContent = `Всего: ${total} ₽`;
  elements.itemCountElement.textContent = count;
}

// Обновление текста счетчика корзины
function updateCartText() {
  itemCount = Object.values(cartData).reduce((sum, i) => sum + i.quantity, 0);
  if (elements.itemCountElement) {
    elements.itemCountElement.textContent = itemCount;
  }
}

// Удаление из корзины
function removeFromCart(id) {
  if (cartData[id]) {
    delete cartData[id];
    updateCartUI();
    updateCartText();
  }
}

// Модалки
function openModal(modal) {
  if (!modal || !elements.overlay) return;
  modal.style.display = 'block';
  elements.overlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  if (!modal || !elements.overlay) return;
  modal.style.display = 'none';

  // Если ни одна модалка не открыта — скрываем overlay
  const modals = [elements.loginModal, elements.foodModal, elements.orderConfirmModal];
  const anyOpen = modals.some(m => m && m.style.display === 'block');
  if (!anyOpen) {
    elements.overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Сайдбары
function openSidebar(sidebar) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    openModal(elements.loginModal);
    return;
  }
  if (!sidebar) return;

  // Закрываем все модалки и overlay при открытии сайдбара
  closeModal(elements.loginModal);
  closeModal(elements.foodModal);
  closeModal(elements.orderConfirmModal);
  elements.overlay.style.display = 'none';

  sidebar.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSidebar(sidebar) {
  if (!sidebar) return;
  sidebar.classList.remove('open');
  document.body.style.overflow = '';
}

// Проверка авторизации и смена кнопки входа
function checkUserAuth() {
  const userId = localStorage.getItem('userId');
  if (userId) {
    updateLoginButtonToProfile();
  }
}

function updateLoginButtonToProfile() {
  const loginBtn = document.getElementById('loginButton');
  if (!loginBtn) return;
  const username = localStorage.getItem('userDisplayName') || localStorage.getItem('username') || 'Профиль';

  loginBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
    ${username}
  `;
  loginBtn.id = 'profileButton';

  const newBtn = loginBtn.cloneNode(true);
  loginBtn.parentNode.replaceChild(newBtn, loginBtn);

  newBtn.addEventListener('click', e => {
    e.preventDefault();
    openSidebar(elements.profileSidebar);
    loadProfile();
  });
}

// Логин
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    alert('Заполните все поля');
    return;
  }

  // TODO: здесь вызов api или локальная авторизация

  // Для демонстрации сразу считаем что логин успешен:
  localStorage.setItem('accessToken', 'demo_token');
  localStorage.setItem('userId', 'demo_user');
  localStorage.setItem('username', email);

  closeModal(elements.loginModal);
  updateLoginButtonToProfile();
  showNotification('Вход выполнен');
}

// Регистрация
async function handleRegistration(e) {
  e.preventDefault();
  // Добавь по аналогии с логином
  alert('Регистрация пока не реализована');
}

// Профиль - загрузка заказов
function loadProfile() {
  const profileContent = elements.profileContent;
  const userId = localStorage.getItem('userId');
  if (!profileContent || !userId) return;

  const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
  if (orders.length === 0) {
    profileContent.innerHTML = `<p>У вас пока нет заказов</p>`;
    return;
  }

  profileContent.innerHTML = orders.map((order, index) => {
    const date = new Date(order.date).toLocaleString();
    const itemsList = order.items.map(item => `<li>${item.name} × ${item.quantity} (${item.price * item.quantity} ₽)</li>`).join('');
    return `
      <div class="order-item" style="border:1px solid #ddd; padding:10px; margin-bottom:10px;">
        <p><strong>Дата:</strong> ${date}</p>
        <ul>${itemsList}</ul>
        <p><strong>Итого:</strong> ${order.total} ₽</p>
        <button onclick="repeatOrder(${index})">Повторить заказ</button>
      </div>
    `;
  }).join('');
}

// Повтор заказа из профиля
function repeatOrder(orderIndex) {
  const userId = localStorage.getItem('userId');
  if (!userId) return;

  const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
  const order = orders[orderIndex];
  if (!order) return;

  order.items.forEach(item => {
    addToCart({
      id: item.id || `repeat_${Date.now()}_${Math.random()}`,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    });
  });

  showNotification('Заказ добавлен в корзину');
  closeSidebar(elements.profileSidebar);
  openSidebar(elements.cartSidebar);
}

// Оформление заказа
function handleCheckout() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    closeSidebar(elements.cartSidebar);
    openModal(elements.loginModal);
    return;
  }
  if (Object.keys(cartData).length === 0) {
    showNotification('Корзина пуста', 'warning');
    return;
  }
  openModal(elements.orderConfirmModal);
}

// Отправка заказа
function handleOrderSubmission(e) {
  e.preventDefault();
  // Здесь логика отправки заказа на сервер
  // Для демо сохраняем локально
  const userId = localStorage.getItem('userId');
  if (!userId) return;

  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();

  if (!phone || !address) {
    alert('Заполните телефон и адрес');
    return;
  }

  const items = Object.values(cartData).map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity
  }));

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
  orders.push({ date: new Date().toISOString(), items, total, phone, address });
  localStorage.setItem(`orders_${userId}`, JSON.stringify(orders));

  showNotification('Заказ оформлен и сохранён');
  clearCart();
  closeModal(elements.orderConfirmModal);
  closeSidebar(elements.cartSidebar);
}

// Уведомления
function showNotification(message, type = 'success') {
  const notif = document.createElement('div');
  notif.className = `notification notification-${type}`;
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}
