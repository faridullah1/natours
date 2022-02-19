const path = require('path');

const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

if (process.env.NODE_ENV === 'development ') {
	app.use(morgan('dev'));
}

// Setup pug engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const limiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	message: 'To many requests from this IP, please try again after 1 hour.'
});

// Apply the rate limiting middleware to all requests
app.use('/api', limiter);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter)

app.all('*', (req, res, next) => {
	next(new AppError(`Could't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;