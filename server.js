// Entry point
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const appConfig = require('./config/app');
const sequelize = require('./config/database');
const { generalLimiter, authLimiter, paymentLimiter } = require('./middleware/rateLimitMiddleware');
const NotificationService = require('./services/NotificationService');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for development, configure properly for production
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// Session
app.use(session({
  secret: appConfig.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// Make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/payment', paymentLimiter);
app.use('/api/v1', generalLimiter);

// Routes
app.use('/', require('./routes/index'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/v1', require('./routes/api'));
app.use('/api/payment', require('./routes/payment'));
app.use('/admin', require('./routes/admin'));
app.use('/appointments', require('./routes/appointment'));
// Temporarily comment out routes with undefined controllers
// app.use('/posts', require('./routes/post'));
// app.use('/chat', require('./routes/chat'));

// Error handling middleware (must be last)
const { notFound, errorHandler } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    return sequelize.sync();
  })
  .then(() => {
    console.log('Database synced');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Socket.io connection handling
require('./socket/chatSocket')(io);

// Make io accessible in routes and services
app.set('io', io);
NotificationService.setIO(io);

// Initialize cron jobs
if (process.env.NODE_ENV !== 'test') {
  const Scheduler = require('./jobs/scheduler');
  Scheduler.init();
}

// Start server
const PORT = appConfig.port;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
 