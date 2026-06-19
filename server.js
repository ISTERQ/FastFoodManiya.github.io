import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { put } from "@vercel/blob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const JWT_SECRET = 'b3f59c77c06c2d4b6c0d81514f4e4fd7dc17d0f143e8f0bddc4f9306edb969e6';

// Ссылка на базу данных берется из безопасных переменных окружения Vercel
const MONGO_URI = process.env.MONGO_URI; 

// Настройка Middleware
app.use(cors({
  origin: ['https://vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Подключение к базе данных MongoDB
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Успешное подключение к MongoDB'))
    .catch(err => console.error('Ошибка подключения к MongoDB:', err));
} else {
  console.warn('Внимание: Переменная MONGO_URI отсутствует в настройках Vercel!');
}

// Безопасный эндпоинт для работы с файлами Vercel Blob
app.get('/api/test-blob', async (req, res) => {
  try {
    const { url } = await put('articles/blob.txt', 'Hello World!', { access: 'public' });
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Модель пользователей
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Модель заказов
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ id: String, name: String, price: Number, quantity: Number }],
  total: { type: Number, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' }
});
const Order = mongoose.model('Order', orderSchema);

// Регистрация профиля
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Все поля обязательны' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Пользователь уже существует' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Регистрация успешна', userId: newUser._id });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// Авторизация
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email и пароль обязательны' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Неверный email или пароль' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Неверный email или пароль' });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Вход успешен', accessToken: token, userId: user._id, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
});

// Защита роутов токеном
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

// Добавление нового заказа
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, total, phone, address } = req.body;
    if (!items || !total || !phone || !address) return res.status(400).json({ message: 'Неверные данные заказа' });

    const order = new Order({ userId: req.user.userId, items, total, phone, address });
    await order.save();
    res.status(201).json({ message: 'Заказ успешно создан', orderId: order._id });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера при создании заказа' });
  }
});

// История заказов пользователя
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера при получении заказов' });
  }
});

// Данные о текущем пользователе
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера при получении пользователя' });
  }
});

// Раздача фронтенда для любых других запросов
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск для локальной среды разработки
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
