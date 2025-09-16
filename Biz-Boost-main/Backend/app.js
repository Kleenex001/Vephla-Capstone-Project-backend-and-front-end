const express = require('express');
const dotenv = require('dotenv');
/*const helmet = require('helmet');*/
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');

// Load environment variables as early as possible
dotenv.config();

// DB connection
const connectDB = require('./config/db');
connectDB();

// Route imports
const authRoutes = require('./routes/authRoutes');
const salesRoutes = require('./routes/salesRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');

// Error handler and Swagger
const errorHandler = require('./middleware/errorHandler');
const { swaggerUi, swaggerSpec } = require('./swagger');

const app = express();

// ✅ CORS setup
const allowedOrigins = [
  'https://biz-boost.onrender.com',
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// ✅ Security middleware
/*app.use(helmet());*/

const limiter = rateLimit({
    windowMs: 50 * 60 * 1000, // 50 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ View engine (Pug)
app.set('view engine', 'pug');

// ✅ Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ✅ Health and test routes
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "OK" });
});

app.get('/test', (req, res) => {
    res.json({ message: 'Test route works' });
});

// ✅ Static HTML routes (clean URLs without .html)
app.get('/features', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/features.html'));
});
app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pricing.html'));
});
app.get('/about-us', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/aboutus.html'));
});
app.get('/contact-us', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/contactus.html'));
});
app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/signin.html'));
});
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/signup.html'));
});

app.get('/sales', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/sales.html'));
});
app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/settings.html'));
});
app.get('/suppliers', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/suppliers.html'));
});
app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/reset password.html'));
});
app.get('/inventory', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/inventory.html'));
});
app.get('/delivery', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/delivery.html'));
});
app.get('/customers', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/customers.html'));
});
app.get('/request-password-reset', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/request password reset.html'));
});
// ✅ Dashboard route
app.get('/dashboard', (req, res) => {
    const user = req.user || { name: 'Guest' };
    res.render('dashboard', { name: user.name });
});

// ✅ API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/settings', settingsRoutes);

// ✅ Login message route
app.get('/login', (req, res) => {
    res.send('Please log in to access Dashboard.');
});

// ✅ Form submission example
app.post('/submit', (req, res) => {
    try {
        const { name, email, comments } = req.body;
        console.log('Received form submission:', { name, email, comments });

        // Check for missing or empty data
        if (!name || !email || !comments) {
            console.error('Form submission failed: Missing fields.');
            return res.status(400).json({ error: 'Missing name, email, or comments.' });
        }

        // Acknowledge the request
        res.status(200).send('Received sucessfully');
    } catch (error) {
        console.error('Error in /submit route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ✅ 404 route
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ✅ Global error handler
app.use(errorHandler);

module.exports = app;
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
