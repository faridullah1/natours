const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongooseSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES

app.use(cors({credentials: true, origin: 'http://localhost:3000'}));

// Set security http headers;
app.use(helmet({
	contentSecurityPolicy: false
}));

// Development logging;
if (process.env.NODE_ENV === 'development ') {
	app.use(morgan('dev'));
}

// Setup pug engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Limit request from same IP;
const limiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	message: 'To many requests from this IP, please try again after 1 hour.'
});

// Apply the rate limiting middleware to all requests
app.use('/api', limiter);

// Body parser; reading data from request body;
app.use(express.json({ limit: '10kb'}));
app.use(cookieParser());

// Data sanitization again NoSQL query injection;
app.use(mongooseSanitize());

// Data sanitization against XSS (Cross Site Scripting);
app.use(xss());

// Serving static files;
app.use(express.static(path.join(__dirname, 'public')));

// Test Middleware
app.use((req, res, next) => {
	next();
});

// Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
	next(new AppError(`Could't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;