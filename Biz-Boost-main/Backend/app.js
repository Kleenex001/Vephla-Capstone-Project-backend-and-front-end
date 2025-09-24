// app.js

require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');



const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(helmet());

// ------------------- CORS --------------------
const allowedOrigins = [
  'https://bizboostcom.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];


app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// -------------------- STATIC FILES --------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------------- ROUTES --------------------
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const customerRoutes = require('./routes/customerRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const contactRoutes = require('./routes/contactRoutes');

const { protect } = require('./middleware/authMiddleware');

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);

// Protected routes
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/customers', protect, customerRoutes);
app.use('/api/inventory', protect, inventoryRoutes);
app.use('/api/sales', protect, salesRoutes);
app.use('/api/deliveries', protect, deliveryRoutes);
app.use('/api/suppliers', protect, supplierRoutes);
app.use('/api/settings', protect, settingsRoutes);

// -------------------- HEALTH CHECK --------------------
app.get('/', (req, res) => {
  res.send('Biz-Boost Backend is running!');
});

// -------------------- 404 HANDLER --------------------
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// -------------------- CENTRALIZED ERROR HANDLER --------------------
const errorHandler = require('./middleware/errorMiddleware');
app.use(errorHandler);

module.exports = app;
