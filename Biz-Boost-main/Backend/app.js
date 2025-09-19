// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(express.json()); // parse JSON bodies
app.use(morgan('dev')); // logging

const allowedOrigins = [
  'https://bizboostcom.vercel.app', // production
  'http://localhost:5500',           // local dev
  'http://127.0.0.1:5500',           // local dev using 127.0.0.1
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like curl or Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


// -------------------- ROUTES --------------------
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const customerRoutes = require('./routes/customerRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/settings', settingsRoutes);

// -------------------- HEALTH CHECK --------------------
app.get('/', (req, res) => {
  res.send('Biz-Boost Backend is running!');
});

// -------------------- ERROR HANDLING --------------------
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
