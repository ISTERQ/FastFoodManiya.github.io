const express = require('express');
const path = require('path');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

const MONGO_URI = 'mongodb://sosaldbmoy_memberdeal:cf007c3511b5f6c64e2451ee67bfd0b4804acb52@fyghg.h.filess.io:61004/sosaldbmoy_memberdeal';

const JWT_SECRET = 'Очень_секретный_ключ_замени_на_случайный_стринг';

// Middleware
app.use(cors({
  origin: 'https://fastfoodmaniya-github-io.onrender.com',
  credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

// Подключение к MongoDB
let db;
MongoClient.connect(MONGO_URI)
  .then(client => {
    db = client.db();
    console.log('Connected to MongoDB');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Регистрация
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'Все поля обязательны' });

    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, email, password: hashedPassword, createdAt: new Date() };
    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({ message: 'Регистрация успешна', userId: result.insertedId });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// Вход
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email и пароль обязательны' });

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Неверный email или пароль' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: 'Неверный email или пароль' });

    const accessToken = jwt.sign(
      { userId: user._id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: 'Вход успешен', accessToken, userId: user._id, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
});

// Middleware авторизации по JWT
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

// Создание заказа (только для авторизованных)
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, total, phone, address } = req.body;
    if (!items || !total || !phone || !address) {
      return res.status(400).json({ message: 'Неверные данные заказа' });
    }

    const ordersCollection = db.collection('orders');
    const newOrder = {
      userId: new ObjectId(req.user.userId),
      items,
      total,
      phone,
      address,
      createdAt: new Date(),
      status: 'pending'
    };

    const result = await ordersCollection.insertOne(newOrder);
    res.status(201).json({ message: 'Заказ успешно создан', orderId: result.insertedId });

    console.log(`Новый заказ #${result.insertedId} от пользователя ${req.user.userId}`);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ message: 'Ошибка сервера при создании заказа' });
  }
});

// Получение заказов пользователя (только для авторизованных)
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const ordersCollection = db.collection('orders');
    const userOrders = await ordersCollection.find({ userId: new ObjectId(req.user.userId) }).toArray();
    res.json(userOrders);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ message: 'Ошибка сервера при получении заказов' });
  }
});

// Получение данных пользователя
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } }
    );

    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Ошибка сервера при получении данных пользователя' });
  }
});

// Статика и 404
app.use(express.static('.'));
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
