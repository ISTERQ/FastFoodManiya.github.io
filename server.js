
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// In-memory storage (в продакшене лучше использовать базу данных)
let users = [];
let orders = [];

// Обслуживание главной страницы
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API для регистрации
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  
  // Проверяем, существует ли пользователь
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
  }
  
  // Создаем нового пользователя
  const newUser = {
    id: 'user_' + Date.now(),
    username,
    email,
    password,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  res.status(201).json({ 
    message: 'Пользователь успешно зарегистрирован',
    userId: newUser.id 
  });
});

// API для входа
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Находим пользователя
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }
  
  // Создаем простой токен (в продакшене использовать JWT)
  const accessToken = 'token_' + user.id + '_' + Date.now();
  
  res.json({
    message: 'Вход выполнен успешно',
    accessToken,
    userId: user.id,
    username: user.username
  });
});

// API для выхода
app.post('/logout', (req, res) => {
  res.json({ message: 'Выход выполнен успешно' });
});

// API для создания заказа
app.post('/api/orders', (req, res) => {
  const { userId, items, total, phone, address } = req.body;
  
  const newOrder = {
    id: 'order_' + Date.now(),
    userId,
    items,
    total,
    phone,
    address,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  
  orders.push(newOrder);
  
  // Имитация отправки на почту
  console.log(`Новый заказ #${newOrder.id}:`);
  console.log(`Пользователь: ${userId}`);
  console.log(`Телефон: ${phone}`);
  console.log(`Адрес: ${address}`);
  console.log(`Сумма: ${total} ₽`);
  console.log(`Товары:`, items);
  
  res.status(201).json({
    message: 'Заказ успешно создан',
    orderId: newOrder.id
  });
});

// API для получения заказов пользователя
app.get('/api/orders/:userId', (req, res) => {
  const { userId } = req.params;
  
  const userOrders = orders.filter(order => order.userId === userId);
  
  res.json(userOrders);
});

// API для получения информации о пользователе
app.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params;
  
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }
  
  // Не отправляем пароль
  const { password, ...userInfo } = user;
  
  res.json(userInfo);
});

// Обслуживание статических файлов
app.get('/img/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'img', filename);
  
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    // Отправляем placeholder если файл не найден
    res.sendFile(path.join(__dirname, 'img', 'placeholder.svg'));
  }
});

// Обработка 404 ошибок
app.use('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Откройте http://localhost:${PORT} в браузере`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nСервер остановлен');
  process.exit(0);
});
