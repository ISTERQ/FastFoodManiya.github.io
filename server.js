const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = 'mongodb://sosaldbmoy_memberdeal:cf007c3511b5f6c64e2451ee67bfd0b4804acb52@fyghg.h.filess.io:61004/sosaldbmoy_memberdeal';
const JWT_SECRET = 'b3f59c77c06c2d4b6c0d81514f4e4fd7dc17d0f143e8f0bddc4f9306edb969e6';

// Middleware
app.use(cors({
  origin: 'https://fastfoodmaniya-github-io.onrender.com',
  credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

// Подключение к MongoDB через Mongoose
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Mongoose подключен к MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Ошибка подключения к MongoDB', err);
  });

// Схема и модель пользователя
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Схема и модель заказа
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number
  }],
  total: { type: Number, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' }
});

const Order = mongoose.model('Order', orderSchema);

// Регистрация
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: 'Все поля обязательны' });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Регистрация успешна', userId: newUser._id });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// Вход
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email и пароль обязательны' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: 'Неверный email или пароль' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Неверный email или пароль' });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ message: 'Вход успешен', accessToken: token, userId: user._id, username: user.username });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
});

// Middleware аутентификации
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Токен не предоставлен' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Недействительный токен' });
    req.user = user;
    next();
  });
}

// Создание заказа (защищённый маршрут)
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, total, phone, address } = req.body;

    if (!items || !total || !phone || !address)
      return res.status(400).json({ message: 'Неверные данные заказа' });

    const order = new Order({
      userId: req.user.userId,
      items,
      total,
      phone,
      address
    });

    await order.save();

    res.status(201).json({ message: 'Заказ успешно создан', orderId: order._id });
  } catch (err) {
    console.error('Ошибка создания заказа:', err);
    res.status(500).json({ message: 'Ошибка сервера при создании заказа' });
  }
});

// Получение заказов пользователя (защищённый маршрут)
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Ошибка получения заказов:', err);
    res.status(500).json({ message: 'Ошибка сервера при получении заказов' });
  }
});

// Получение информации о пользователе (защищённый маршрут)
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    res.json(user);
  } catch (err) {
    console.error('Ошибка получения пользователя:', err);
    res.status(500).json({ message: 'Ошибка сервера при получении пользователя' });
  }
});

// Статика и 404
app.use(express.static('.'));
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
